import { Router } from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { Response } from "../response.js";
import { requireAuth } from "../auth/requireAuth.js";
import {
    deleteUserAccountRow,
    findAccountById,
    invalidateUserCache,
    upsertUser,
} from "../auth/passport.js";
import { findGuestIdByLoginToken } from "../auth/guestLoginLinks.js";
import { pickAccountSettings } from "#shared/accountSettings.js";
import { getAvatar } from "../services/avatarProxy.js";
import { supabase, supabaseAuth } from "../supabaseClient.js";
import { resolveBaseURL } from "../utils.js";

const router = Router();
const LOGIN_FAILED_ROUTE = "/login?failed=true";
// Not under /auth — that prefix is reserved for backend routes (see vite.config.js proxy).
const EMAIL_CALLBACK_URL = `${resolveBaseURL("frontend")}/login/callback`;

// Anti-spam against bots mostly, but might also hit users who fail to login (such as bad connection).
// Only every 15 minutes though
const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later." },
});

// Looser, since the guest link page looks this up on every visit.
const guestLinkInfoLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
});

// Stashes ?board=<shortId> in the session so it survives the OAuth round-trip; read by loginCallback below.
function stashBoardRedirect(req, res, next) {
    if (req.query.board) req.session.pendingBoardRedirect = req.query.board;
    else delete req.session.pendingBoardRedirect;
    next();
}

// Return function called after successful login
async function loginCallback(req, res) {
    console.log(
        `Hello, ${req.user?.display_name || req.user?.username || "unknown user"} from ${req.user?.provider}! 👋`,
    );
    const board = req.session.pendingBoardRedirect;
    delete req.session.pendingBoardRedirect;
    res.redirect(board ? `/app/${board}` : "/app");
}

function authCallback(provider) {
    return function handleAuthCallback(req, res, next) {
        passport.authenticate(
            provider,
            { failureRedirect: LOGIN_FAILED_ROUTE },
            (err, user, info) => {
                if (err) {
                    console.error("OAuth fatal error:", err);
                    return next(err);
                }

                if (!user) {
                    console.error("OAuth login failed:", info);
                    return res.redirect(LOGIN_FAILED_ROUTE);
                }

                req.logIn(user, (loginErr) => {
                    if (loginErr) {
                        console.error("Session login error:", loginErr);
                        return next(loginErr);
                    }
                    return loginCallback(req, res, next);
                });
            },
        )(req, res, next);
    };
}

async function getRequestIdentity(req, res) {
    const { OK, NO_CONTENT, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

    if (req.isAuthenticated()) {
        let account;
        try {
            account = await findAccountById(req.user.id);
        } catch (error) {
            return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });
        }
        Response.send(res, OK, { user: account });
    } else {
        Response.send(res, NO_CONTENT, { message: "Requester is not logged in." });
    }
}

// Owners and guests each keep their own display settings, independent of the board.
async function saveAccountSettings(req, res) {
    const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const settings = pickAccountSettings(req.body?.settings);
    if (!settings) return Response.send(res, BAD_REQUEST, { error: "Invalid settings." });

    const table = req.user.member_username ? "guests" : "users";
    const { error } = await supabase.from(table).update({ settings }).eq("id", req.user.id);
    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });

    invalidateUserCache(req.user.id);
    Response.send(res, OK, { message: "Settings saved." });
}

async function logout(req, res, next) {
    console.log(`Logging out ${req.user.display_name} 🚪`);
    req.logout((err) => {
        if (err) return next(err);
        req.session.destroy((err) => {
            if (err) return next(err);
            res.clearCookie("connect.sid"); // maybe a better way to centeralize all cookies to be a specific key name and not this?
            res.redirect("/"); // back to the homepage
        });
    });
}

async function deleteAccount(req, res) {
    const { OK, NO_CONTENT, FORBIDDEN, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    if (!req.isAuthenticated())
        return Response.send(res, NO_CONTENT, { message: "Requester is not logged in." });

    if (req.user.member_username) {
        return Response.send(res, FORBIDDEN, {
            error: "Guests cannot delete themselves.",
        });
    }

    try {
        await deleteUserAccountRow(req.user);
    } catch (err) {
        return Response.send(res, INTERNAL_SERVER_ERROR, {
            message: "Error deleting account: " + err.message,
        });
    }

    req.session.destroy((err) => {
        if (err) {
            return Response.send(res, INTERNAL_SERVER_ERROR, {
                message: "Error deleting account: " + err,
            });
        }
        res.clearCookie("connect.sid");
        return Response.send(res, OK, { message: "Account Deleted" });
    });
}

function emailProfileFrom(supabaseUser) {
    return {
        id: supabaseUser.id,
        email: supabaseUser.email,
        displayName: supabaseUser.email.split("@")[0],
    };
}

// Starts the session and replies with the user.
function logInAndRespond(req, res, user) {
    const { OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    return new Promise((resolve) => {
        req.logIn(user, (err) => {
            if (err) {
                Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
            } else {
                Response.send(res, OK, { user });
            }
            resolve();
        });
    });
}

async function establishGuestSession(req, res, guest) {
    // guest.id is its own generated key, not the Supabase Auth id (that's auth_user_id).
    const { data: updatedGuest, error } = await supabase
        .from("guests")
        .update({ last_login: new Date() })
        .eq("id", guest.id)
        .select()
        .single();
    if (error) throw error;
    return logInAndRespond(req, res, updatedGuest);
}

async function establishEmailSession(req, res, supabaseUser) {
    const user = await upsertUser(emailProfileFrom(supabaseUser), "email");
    return logInAndRespond(req, res, user);
}

// Check if we have this email in our records.
async function emailExists(req, res) {
    const { BAD_REQUEST, OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { email } = req.body;
    if (!email) return Response.send(res, BAD_REQUEST, { error: "Email is required." });

    const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("provider", "email")
        .ilike("email", email)
        .limit(1);
    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });

    Response.send(res, OK, { exists: data.length > 0 });
}

async function emailSignup(req, res) {
    const { BAD_REQUEST, OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { email, password } = req.body;
    if (!email || !password) {
        return Response.send(res, BAD_REQUEST, { error: "Email and password are required." });
    }

    const { data, error } = await supabaseAuth.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: EMAIL_CALLBACK_URL },
    });
    if (error) return Response.send(res, BAD_REQUEST, { error: error.message });

    // No session yet if "Confirm email" is enabled on the Supabase project.
    if (!data.session) {
        return Response.send(res, OK, { confirmationRequired: true });
    }

    try {
        await establishEmailSession(req, res, data.user);
    } catch (err) {
        Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

async function emailLogin(req, res) {
    const { BAD_REQUEST, UNAUTHORIZED, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { email, password } = req.body;
    if (!email || !password) {
        return Response.send(res, BAD_REQUEST, { error: "Email and password are required." });
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({ email, password });
    if (error) return Response.send(res, UNAUTHORIZED, { error: "Invalid email or password." });

    try {
        await establishEmailSession(req, res, data.user);
    } catch (err) {
        Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

// Unless we want this feature, it's disabled for now.
const MAGIC_LINK_ENABLED = false;
async function emailMagicLink(req, res) {
    const { BAD_REQUEST, OK, SERVICE_UNAVAILABLE, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    if (!MAGIC_LINK_ENABLED) {
        return Response.send(res, SERVICE_UNAVAILABLE, {
            error: "Magic link sign-in is not available right now.",
            code: Response.ErrorCode.FEATURE_DISABLED,
        });
    }

    const { email } = req.body;
    if (!email) return Response.send(res, BAD_REQUEST, { error: "Email is required." });

    const { error } = await supabaseAuth.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: EMAIL_CALLBACK_URL },
    });
    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });

    Response.send(res, OK, { message: "Magic link sent, check your email." });
}

// Accepts either a bare short id "asdfghjk" or a full pasted board link
function extractBoardShortId(input) {
    if (!input || typeof input !== "string") return null;
    const trimmed = input.trim();
    const match = trimmed.match(/\/(?:app|board)\/([a-zA-Z0-9]+)/);
    return match ? match[1] : trimmed || null;
}

async function findBoardIdByShortId(shortId) {
    const { data } = await supabase
        .from("boards")
        .select("id")
        .eq("short_id", shortId)
        .maybeSingle();
    return data?.id ?? null;
}

// Login for board-guest accounts
async function guestLogin(req, res) {
    const { BAD_REQUEST, UNAUTHORIZED, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { username, password, board } = req.body;
    const boardShortId = extractBoardShortId(board);
    if (!username || !password || !boardShortId) {
        return Response.send(res, BAD_REQUEST, {
            error: "Username, password, and the board link are required.",
        });
    }

    const boardId = await findBoardIdByShortId(boardShortId);

    const invalidCredentials = () =>
        Response.send(res, UNAUTHORIZED, { error: "Invalid username, password, or board link." });
    if (!boardId) return invalidCredentials();

    const { data: guest, error: lookupError } = await supabase
        .from("guests")
        .select("*")
        .eq("member_username", username)
        .eq("home_board_id", boardId)
        .maybeSingle();
    if (lookupError || !guest) return invalidCredentials();

    // Guests have no email of their own, only their Supabase Auth user does, fetched here since
    // signInWithPassword needs it and we don't store it on our side.
    const { data: authUser, error: authLookupError } = await supabase.auth.admin.getUserById(
        guest.auth_user_id,
    );
    if (authLookupError || !authUser?.user) return invalidCredentials();

    const { error } = await supabaseAuth.auth.signInWithPassword({
        email: authUser.user.email,
        password,
    });
    if (error) return invalidCredentials();

    try {
        await establishGuestSession(req, res, guest);
    } catch (err) {
        Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

const INVALID_GUEST_LINK =
    "This login link doesn't work anymore. Ask the board owner for a new one.";

// The guest a login link belongs to, or null. Only works on the guest's own board.
async function findLinkGuest(board, token) {
    const boardShortId = extractBoardShortId(board);
    if (!boardShortId) return null;

    const boardId = await findBoardIdByShortId(boardShortId);
    if (!boardId) return null;

    const guestId = await findGuestIdByLoginToken(token);
    if (!guestId) return null;

    const { data: guest } = await supabase
        .from("guests")
        .select("id, display_name")
        .eq("id", guestId)
        .eq("home_board_id", boardId)
        .maybeSingle();
    return guest;
}

// Who a login link belongs to, shown before signing in.
async function guestLinkInfo(req, res) {
    const { OK, UNAUTHORIZED, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    try {
        const guest = await findLinkGuest(req.body.board, req.body.token);
        if (!guest) return Response.send(res, UNAUTHORIZED, { error: INVALID_GUEST_LINK });
        Response.send(res, OK, { guest: { id: guest.id, displayName: guest.display_name } });
    } catch (err) {
        Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

// Login for board-guest accounts with their login link
async function guestLinkLogin(req, res) {
    const { UNAUTHORIZED, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    try {
        const guest = await findLinkGuest(req.body.board, req.body.token);
        if (!guest) return Response.send(res, UNAUTHORIZED, { error: INVALID_GUEST_LINK });
        await establishGuestSession(req, res, guest);
    } catch (err) {
        Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

// access_token comes from the URL fragment, which never reaches the server directly.
async function emailSession(req, res) {
    const { BAD_REQUEST, UNAUTHORIZED, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { access_token } = req.body;
    if (!access_token) return Response.send(res, BAD_REQUEST, { error: "Missing access token." });

    const { data, error } = await supabaseAuth.auth.getUser(access_token);
    if (error || !data?.user) {
        return Response.send(res, UNAUTHORIZED, { error: "Invalid or expired link." });
    }

    try {
        await establishEmailSession(req, res, data.user);
    } catch (err) {
        Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

router.get("/me", getRequestIdentity);
router.post("/settings", requireAuth, saveAccountSettings);
router.get("/logout", requireAuth, logout);
router.get("/avatar", getAvatar);
router.delete("/deleteAccount", deleteAccount);

// Login routes
router.get(
    "/steam",
    oauthLimiter,
    stashBoardRedirect,
    passport.authenticate("steam", { failureRedirect: LOGIN_FAILED_ROUTE }),
);
router.get(
    "/google",
    oauthLimiter,
    stashBoardRedirect,
    passport.authenticate("google", {
        failureRedirect: LOGIN_FAILED_ROUTE,
        scope: ["profile", "email", "openid"],
    }),
);
router.get(
    "/discord",
    oauthLimiter,
    stashBoardRedirect,
    passport.authenticate("discord", { failureRedirect: LOGIN_FAILED_ROUTE }),
);

// Email login (password + magic link), built on Supabase Auth
router.post("/email/exists", emailExists);
router.post("/email/signup", oauthLimiter, emailSignup);
router.post("/email/login", oauthLimiter, emailLogin);
router.post("/email/magic-link", oauthLimiter, emailMagicLink);
router.post("/email/session", emailSession);

router.post("/guest/login", oauthLimiter, guestLogin);
router.post("/guest/link", oauthLimiter, guestLinkLogin);
// POST so the token stays out of URLs and logs.
router.post("/guest/link/info", guestLinkInfoLimiter, guestLinkInfo);

// Strategy callbacks
// Google and Discord - if renamed, update accordingly in the respective developer portal
router.get("/steam/return", oauthLimiter, authCallback("steam"));
router.get("/google/callback", oauthLimiter, authCallback("google"));
router.get("/discord/callback", oauthLimiter, authCallback("discord"));

export default router;
