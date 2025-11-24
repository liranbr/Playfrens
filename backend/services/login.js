import { Service } from "../service.js";
import { Response } from "../response.js";
import SteamStrategy from "passport-steam";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import session from "express-session";
import { resolveBaseURL, strToBool } from "../utils.js";
import { supabase } from "../server.js";

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
        passport.serializeUser((user, done) => done(null, user.id));
        passport.deserializeUser(async (id, done) => {
            const { data: user, error } = await supabase
                .from("users")
                .select("*")
                .eq("id", id)
                .single();
            done(error, user);
        });

        const URL = resolveBaseURL("frontend");
        passport.use(
            new SteamStrategy(
                {
                    returnURL: `${URL}/auth/steam/return`,
                    realm: `${URL}/`,
                    apiKey: process.env.STEAM_WEB_API_KEY,
                },
                async (identifier, profile, done) => {
                    profile.identifier = identifier;
                    try {
                        const user = await this.upsertUser(profile, "steam");
                        done(null, user);
                    } catch (err) {
                        done(err);
                    }
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
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        console.log(profile);
                        const user = await this.upsertUser(profile, "google");
                        done(null, user);
                    } catch (err) {
                        done(err);
                    }
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
                    scope: ["profile", "openid"],
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

    async steamReturn(req, res) {
        console.log(`Hello, ${req.user?.display_name || "Steam user"}!`);
        res.redirect("/");
    }

    async googleCallback(req, res) {
        console.log(`Hello, ${req.user?.display_name || "Google user"}!`);
        res.redirect("/");
    }

    async upsertUser(profile, provider) {
        const providerId = (() => {
            switch (provider) {
                case "steam":
                    return profile.identifier;
                case "google":
                    return profile.id;
            }
            return undefined;
        })();

        // Check if user exists by provider
        const { data: existingUser } = await supabase
            .from("users")
            .select("*")
            .eq("provider", provider)
            .eq("provider_id", providerId)
            .single();

        const avatar_url = profile.photos?.length ? profile.photos.at(-1).value : null;
        const email = profile.emails?.[0]?.value;
        let userId;

        if (existingUser) {
            userId = existingUser.id;
            // Update user
            const { error: updateError } = await supabase
                .from("users")
                .update({
                    display_name: profile.displayName,
                    avatar_url,
                    email,
                    last_login: new Date(),
                })
                .eq("id", userId);
            if (updateError) throw updateError;
        } else {
            // Insert new user
            const { data: newUser, error: insertError } = await supabase
                .from("users")
                .insert({
                    display_name: profile.displayName,
                    avatar_url,
                    email,
                    provider,
                    provider_id: providerId,
                    last_login: new Date(),
                })
                .select()
                .single();
            if (insertError) throw insertError;

            userId = newUser.id;

            // Create empty board
            const { error: boardError } = await supabase
                .from("boards")
                .insert({ owner_id: userId });
            if (boardError) console.error("Error creating board:", boardError);
        }

        const { data: user, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();
        if (userError) throw userError;

        return user;
    }
}
