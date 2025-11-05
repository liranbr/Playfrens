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

        console.log("hello");

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
        console.log(`Hello, ${req.user?.displayName || "Steam user"}!`);
        res.redirect(resolveBaseURL("frontend"));
    }

    async googleCallback(req, res) {
        console.log(`Hello, ${req.user?.displayName || "Google user"}!`);
        res.redirect(resolveBaseURL("frontend"));
    }

    async upsertUser(profile, provider) {
        const providerId = (() => {
            switch (provider) {
                // Equals to https://steamcommunity.com/openid/id/<Steam-Account-ID>
                case "steam":
                    return profile.identifier;
                // Usually equals to <Google-Account-ID> but is different depending on the GAccount type or OAuth project.
                // Under the hood its _json.sub but passport shoudl map this for conviences under id
                case "google":
                    return profile.id;
            }
            return undefined;
        })();
        let userId;

        // check if provider already exists
        const { data: existingProvider, error: fetchError } = await supabase
            .from("user_providers")
            .select("user_id")
            .eq("provider", provider)
            .eq("provider_id", providerId)
            .single();

        // no rows found
        if (fetchError && fetchError.code !== "PGRST116") {
            console.error("Error checking provider:", fetchError);
            throw fetchError;
        }

        if (existingProvider) {
            userId = existingProvider.user_id;

            // update dynamic info
            const avatar_url = profile.photos?.length > 0 ? profile.photos.at(-1).value : null;
            const email = profile.emails?.[0]?.value;

            const { error: updateError } = await supabase
                .from("users")
                .update({
                    display_name: profile.displayName,
                    avatar_url: avatar_url,
                    email: email, // optional: only if you want to update for Google
                    last_login: new Date(), // track last login
                })
                .eq("id", userId);

            if (updateError) {
                console.error("Error updating existing user:", updateError);
                throw updateError;
            }
        } else {
            const avatar_url = profile.photos?.length > 0 ? profile.photos.at(-1).value : null;
            const email = profile.emails?.[0]?.value;

            // insert new user in users table
            const { data: newUser, error: insertUserError } = await supabase
                .from("users")
                .insert({
                    display_name: profile.displayName,
                    avatar_url: avatar_url,
                    email: email,
                })
                .select()
                .single();

            if (insertUserError) {
                console.error("Error inserting new user:", insertUserError);
                throw insertUserError;
            }

            userId = newUser.id;

            // link provider
            const { error: linkError } = await supabase.from("user_providers").insert({
                user_id: userId,
                provider,
                provider_id: providerId,
            });

            if (linkError) {
                console.error("Error linking provider:", linkError);
                throw linkError;
            }
        }

        // return user
        const { data: user, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

        if (userError) throw userError;
        return user;
    }
}
