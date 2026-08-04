import { Router } from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { Response } from "../response.js";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../auth/requireAuth.js";
import { invalidateUserCache } from "../auth/passport.js";
import { strToBool } from "../utils.js";

const router = Router();
const LOGIN_FAILED_ROUTE = "/login?failed=true";

// Anti-spam against bots mostly, but might also hit users who fail to login (such as bad connection).
// Only every 15 minutes though
const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later." },
});

// Providers whose avatar URLs we're willing to fetch server-side for the /avatar proxy below.
const ALLOWED_AVATAR_HOSTS = [
    "lh3.googleusercontent.com",
    "cdn.discordapp.com",
    "avatars.steamstatic.com",
    "avatars.akamai.steamstatic.com",
];

// Kill switch: set to false to redirect straight to the DB's avatar URL instead of proxying.
const AVATAR_PROXY_ENABLED = strToBool(process.env.AVATAR_PROXY_ENABLED ?? "true");

// TODO: swap these Maps for a real cache (Redis or similar), they grow unbounded and
// reset on every restart/deploy, which is really bad for in long-term.
// This project will not go viral, right? Right???
const AVATAR_CACHE_LIFETIME_MS = 60 * 60 * 1000; // 1 hour
const avatarCache = new Map(); // userId -> { buffer, contentType, expiresAt }
const avatarFetches = new Map(); // userId -> in-flight fetch promise, to avoid double and more requests

async function fetchAvatar(avatarUrl) {
    const upstream = await fetch(avatarUrl);
    if (!upstream.ok) throw new Error(`Provider responded with ${upstream.status}`);
    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await upstream.arrayBuffer());
    return { buffer, contentType, expiresAt: Date.now() + AVATAR_CACHE_LIFETIME_MS };
}

async function getAvatar(req, res) {
    const { OK, NOT_FOUND, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

    if (!req.isAuthenticated() || !req.user.avatar_url) {
        return Response.send(res, NOT_FOUND, { error: "No avatar available." });
    }

    if (!AVATAR_PROXY_ENABLED) {
        return res.redirect(req.user.avatar_url);
    }

    let host;
    try {
        host = new URL(req.user.avatar_url).host;
    } catch {
        return Response.send(res, NOT_FOUND, { error: "Invalid avatar URL." });
    }
    if (!ALLOWED_AVATAR_HOSTS.includes(host)) {
        return Response.send(res, NOT_FOUND, { error: "Unsupported avatar host." });
    }

    const userId = req.user.id;
    const cached = avatarCache.get(userId);

    if (cached && cached.expiresAt > Date.now()) {
        res.set("Content-Type", cached.contentType);
        res.set("Cache-Control", "private, max-age=3600");
        return Response.sendMessage(res, OK, cached.buffer);
    }

    try {
        // Dedupe concurrent requests for the same user into a single upstream fetch.
        let fetchPromise = avatarFetches.get(userId);
        if (!fetchPromise) {
            fetchPromise = fetchAvatar(req.user.avatar_url).finally(() =>
                avatarFetches.delete(userId),
            );
            avatarFetches.set(userId, fetchPromise);
        }
        const fresh = await fetchPromise;
        avatarCache.set(userId, fresh);

        res.set("Content-Type", fresh.contentType);
        res.set("Cache-Control", "private, max-age=3600");
        return Response.sendMessage(res, OK, fresh.buffer);
    } catch (err) {
        console.error("Error fetching avatar:", err);
        // Provider is rate-limiting/unavailable, so fall back to the last known-good copy if it exist.
        if (cached) {
            res.set("Content-Type", cached.contentType);
            res.set("Cache-Control", "private, max-age=60");
            return Response.sendMessage(res, OK, cached.buffer);
        }
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: "Error fetching avatar." });
    }
}

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
        invalidateUserCache(req.user.id); // so other active sessions for this account stop working immediately
        req.session.destroy((err) => {
            if (err) return respondError(err);
            res.clearCookie("connect.sid");
            return Response.send(res, OK, { message: "Account Deleted" });
        });
    } else return respondError(responseStatus);
}

router.get("/me", getRequestIdentity);
router.get("/logout", requireAuth, logout);
router.get("/avatar", getAvatar);
router.delete("/deleteAccount", deleteAccount);

// Login routes
router.get(
    "/steam",
    oauthLimiter,
    passport.authenticate("steam", { failureRedirect: LOGIN_FAILED_ROUTE }),
);
router.get(
    "/google",
    oauthLimiter,
    passport.authenticate("google", {
        failureRedirect: LOGIN_FAILED_ROUTE,
        scope: ["profile", "email", "openid"],
    }),
);
router.get(
    "/discord",
    oauthLimiter,
    passport.authenticate("discord", { failureRedirect: LOGIN_FAILED_ROUTE }),
);

// Strategy callbacks
// Google and Discord - if renamed, update accordingly in the respective developer portal
router.get("/steam/return", oauthLimiter, authCallback("steam"));
router.get("/google/callback", oauthLimiter, authCallback("google"));
router.get("/discord/callback", oauthLimiter, authCallback("discord"));

export default router;

