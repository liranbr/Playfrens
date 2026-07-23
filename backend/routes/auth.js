import { Router } from "express";
import passport from "passport";
import rateLimit from "express-rate-limit";
import { Response } from "../response.js";
import { supabase } from "../supabaseClient.js";

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

router.get("/me", getRequestIdentity);
router.get("/logout", logout);
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
        scope: ["profile", "openid"],
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
