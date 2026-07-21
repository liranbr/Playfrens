import { Router } from "express";
import passport from "passport";
import { Response } from "../response.js";
import { supabase, supabaseAuth } from "../supabaseClient.js";
import { upsertUser } from "../auth/passport.js";
import { resolveBaseURL } from "../utils.js";

const router = Router();
const LOGIN_FAILED_ROUTE = "/login?failed=true";
// Not under /auth — that prefix is reserved for backend routes (see vite.config.js proxy).
const EMAIL_CALLBACK_URL = `${resolveBaseURL("frontend")}/login/callback`;

// Return function called after successful login
async function loginCallback(req, res) {
    console.log(
        `Hello, ${req.user?.display_name || req.user?.username || "unknown user"} from ${req.user?.provider}! 👋`,
    );
    res.redirect("/app");
}

function authCallback(provider) {
    return function handleAuthCallback(req, res, next) {
        passport.authenticate(
            provider,
            { failureRedirect: LOGIN_FAILED_ROUTE },
            (err, user, info) => {
                console.log("OAuth ERROR:", err);
                console.log("OAuth INFO:", info);
                console.log("OAuth USER:", user);

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
        const { data: dbUser, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", req.user.id)
            .single();

        if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });
        Response.send(res, OK, { user: dbUser });
    } else {
        Response.send(res, NO_CONTENT, { message: "Requester is not logged in." });
    }
}

async function logout(req, res, next) {
    const { UNAUTHORIZED } = Response.HttpStatus;

    if (!req.isAuthenticated()) {
        return Response.send(res, UNAUTHORIZED, { error: "Not logged in" });
    }
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
    const { OK, NO_CONTENT, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    if (!req.isAuthenticated())
        return Response.send(res, NO_CONTENT, { message: "Requester is not logged in." });

    const { status: responseStatus, error: deletionError } = await supabase
        .from("users")
        .delete()
        .eq("id", req.user.id);

    const respondError = (error) => {
        Response.send(res, INTERNAL_SERVER_ERROR, {
            message: "Error deleting account: " + error,
        });
    };

    if (deletionError) {
        return respondError(deletionError.message);
    }
    // 204 is the expected response for deleting data
    if (responseStatus === 204) {
        req.session.destroy((err) => {
            if (err) return respondError(err);
            res.clearCookie("connect.sid");
            return Response.send(res, OK, { message: "Account Deleted" });
        });
    } else return respondError(responseStatus);
}

function emailProfileFrom(supabaseUser) {
    return {
        id: supabaseUser.id,
        email: supabaseUser.email,
        displayName: supabaseUser.email.split("@")[0],
    };
}

function establishEmailSession(req, res, supabaseUser) {
    const { OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    return upsertUser(emailProfileFrom(supabaseUser), "email").then(
        (user) =>
            new Promise((resolve) => {
                req.logIn(user, (err) => {
                    if (err) {
                        Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
                    } else {
                        Response.send(res, OK, { user });
                    }
                    resolve();
                });
            }),
    );
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

async function emailMagicLink(req, res) {
    const { BAD_REQUEST, OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { email } = req.body;
    if (!email) return Response.send(res, BAD_REQUEST, { error: "Email is required." });

    const { error } = await supabaseAuth.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: EMAIL_CALLBACK_URL },
    });
    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });

    Response.send(res, OK, { message: "Magic link sent, check your email." });
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
router.get("/logout", logout);
router.delete("/deleteAccount", deleteAccount);

// Login routes
router.get("/steam", passport.authenticate("steam", { failureRedirect: LOGIN_FAILED_ROUTE }));
router.get(
    "/google",
    passport.authenticate("google", {
        failureRedirect: LOGIN_FAILED_ROUTE,
        scope: ["profile", "openid"],
    }),
);
router.get("/discord", passport.authenticate("discord", { failureRedirect: LOGIN_FAILED_ROUTE }));

// Email login (password + magic link), built on Supabase Auth
router.post("/email/signup", emailSignup);
router.post("/email/login", emailLogin);
router.post("/email/magic-link", emailMagicLink);
router.post("/email/session", emailSession);

// Strategy callbacks
// Google and Discord - if renamed, update accordingly in the respective developer portal
router.get("/steam/return", authCallback("steam"));
router.get("/google/callback", authCallback("google"));
router.get("/discord/callback", authCallback("discord"));

export default router;

