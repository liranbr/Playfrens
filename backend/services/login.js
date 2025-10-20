import { Service } from "../service.js";
import { Response } from "../response.js";
import SteamStrategy from "passport-steam";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import session from "express-session";
import { resolveBaseURL, strToBool } from "../utils.js";

export class LoginService extends Service {
    constructor(app) {
        super(app, process.env.SESSION_SECRET);

        // Allows express to manage sessions
        app.use(
            session({
                secret: process.env.SESSION_SECRET,
                resave: false,
                saveUninitialized: false,
                cookie: {
                    secure: app.locals.isProd || strToBool(process.env.USE_HTTPS),
                    httpOnly: true,
                    sameSite: app.locals.isProd ? "none" : "lax",
                    maxAge: 24 * 60 * 60 * 1000, // 1 day
                },
            }),
        );

        app.use(passport.initialize());
        app.use(passport.session());
        passport.serializeUser((user, done) => done(null, user));
        passport.deserializeUser((obj, done) => done(null, obj));

        const URL = resolveBaseURL("frontend");
        passport.use(
            new SteamStrategy(
                {
                    returnURL: `${URL}/auth/steam/return`,
                    realm: `${URL}/`,
                    apiKey: process.env.STEAM_WEB_API_KEY,
                },
                (identifier, profile, done) => {
                    process.nextTick(() => {
                        profile.identifier = identifier;
                        return done(null, profile);
                    });
                },
            ),
        );
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: `${URL}/auth/google/callback`,
                },
                (accessToken, refreshToken, profile, done) => {
                    // Example user lookup or creation
                    process.nextTick(() => {
                        return done(null, profile);
                    });
                },
            ),
        );
    }
    listen() {
        super.listen();
        this.registerRoutes([
            {
                method: "get",
                path: "/auth/me",
                handler: this.getRequestIdentity.bind(this),
            },
            {
                method: "get",
                path: "/auth/logout",
                handler: this.logout.bind(this),
            },
            // Login Routers
            {
                method: "get",
                path: "/auth/steam",
                handler: passport.authenticate("steam", { failureRedirect: "/" }),
            },
            {
                method: "get",
                path: "/auth/google",
                handler: passport.authenticate("google", {
                    scope: ["profile"],
                    failureRedirect: "/",
                }),
            },
            // Strategy Callbacks
            {
                method: "get",
                path: "/auth/steam/return",
                handler: [
                    passport.authenticate("steam", { failureRedirect: "/" }),
                    this.steamReturn.bind(this),
                ],
            },
            {
                method: "get",
                // Caution with renaming the path here, it must be similar to Google Developer Console.
                path: "/auth/google/callback",
                handler: [
                    passport.authenticate("google", { failureRedirect: "/" }),
                    this.googleCallback.bind(this),
                ],
            },
        ]);
    }

    async logout(req, res, next) {
        const { UNAUTHORIZED } = Response.HttpStatus;

        if (!req.isAuthenticated()) {
            return Response.send(res, UNAUTHORIZED, { error: "Not logged in" });
        }
        console.log(`Logging out ${req.user.displayName} 🚪`);
        req.logout((err) => {
            if (err) return next(err);
            req.session.destroy((err) => {
                if (err) return next(err);
                res.clearCookie("connect.sid"); // maybe a better way to centeralize all cookies to be a specific key name and not this?
                res.redirect("/");
            });
        });
    }

    // Returns the user's information used to login with (e.g. Steam public data)
    async getRequestIdentity(req, res) {
        const { OK, NO_CONTENT } = Response.HttpStatus;

        if (req.isAuthenticated()) {
            Response.send(res, OK, { user: req.user });
        } else {
            Response.send(res, NO_CONTENT, { message: "Requester is not logged in." });
        }
    }

    async steamReturn(req, res) {
        console.log(`Hello, ${req.user?.displayName || "Steam user"}!`);
        res.redirect(resolveBaseURL("frontend"));
    }

    async googleCallback(req, res) {
        console.log(`Hello, ${req.user?.displayName || "Google user"}!`);
        res.redirect(resolveBaseURL("frontend"));
    }
}
