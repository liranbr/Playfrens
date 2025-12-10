import { Service } from "../service.js";
import { Response } from "../response.js";
import SteamStrategy from "passport-steam";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as DiscordStrategy } from "passport-discord";
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
                    passReqToCallback: true,
                },
                async (req, identifier, profile, done) => {
                    profile.identifier = identifier;

                    if (req.session.connectMode) {
                        await this.connectProvider(req.user.id, profile, "steam");
                        req.session.connectMode = null;
                        return done(null, req.user);
                    }
                    const user = await this.upsertUser(profile, "steam");
                    return done(null, user);
                },
            ),
        );
        passport.use(
            new GoogleStrategy(
                {
                    clientID: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL: `${URL}/auth/google/callback`,
                    passReqToCallback: true,
                },
                async (req, accessToken, refreshToken, profile, done) => {
                    if (req.session.connectMode) {
                        await this.connectProvider(req.user.id, profile, "google");
                        req.session.connectMode = null;
                        return done(null, req.user);
                    }
                    const user = await this.upsertUser(profile, "google");
                    return done(null, user);
                },
            ),
        );
        passport.use(
            new DiscordStrategy(
                {
                    clientID: process.env.DISCORD_CLIENT_ID,
                    clientSecret: process.env.DISCORD_CLIENT_SECRET,
                    callbackURL: `${URL}/auth/discord/callback`,
                    scope: ["identify"],
                    passReqToCallback: true,
                },
                async (req, accessToken, refreshToken, profile, done) => {
                    if (req.session.connectMode) {
                        await this.connectProvider(req.user.id, profile, "discord");
                        req.session.connectMode = null;
                        return done(null, req.user);
                    }

                    const user = await this.upsertUser(profile, "discord");
                    return done(null, user);
                },
            ),
        );
    }
    listen() {
        super.listen();
        const loginFailedRoute = "/login?failed=true";
        const loginRoute = (provider, options) => ({
            method: "get",
            path: `/auth/${provider}`,
            handler: passport.authenticate(provider, {
                failureRedirect: loginFailedRoute,
                ...options,
            }),
        });
        const loginCallbackRoute = (provider, callbackPath) => ({
            method: "get",
            path: `/auth/${provider}/${callbackPath}`,
            handler: [
                passport.authenticate(provider, { failureRedirect: loginFailedRoute }),
                this.loginCallback.bind(this),
            ],
        });

        this.registerRoutes([
            { method: "get", path: "/auth/me", handler: this.getRequestIdentity.bind(this) },
            { method: "get", path: "/auth/logout", handler: this.logout.bind(this) },
            // Login routes
            loginRoute("steam"),
            loginRoute("google", { scope: ["profile", "openid", "email"] }),
            loginRoute("discord"),
            // Callbacks
            loginCallbackRoute("steam", "return"),
            loginCallbackRoute("google", "callback"),
            loginCallbackRoute("discord", "callback"),
            // Connect routes
            {
                method: "get",
                path: "/auth/google/connect",
                handler: this.connectGoogle.bind(this),
            },
            {
                method: "get",
                path: "/auth/discord/connect",
                handler: this.connectDiscord.bind(this),
            },
            {
                method: "get",
                path: "/auth/steam/connect",
                handler: this.connectSteam.bind(this),
            },
        ]);
    }

    async loginCallback(req, res) {
        console.log(`Hello, ${req.user?.display_name} from ${req.user?.provider}! 👋`);
        res.redirect("/app");
    }

    // Logs out the current user
    async logout(req, res, next) {
        const { UNAUTHORIZED } = Response.HttpStatus;

        if (!req.isAuthenticated()) {
            return res.redirect(`/login?error=${UNAUTHORIZED}`);
        }

        console.log(`Logging out ${req.user.display_name} 🚪`);
        req.logout((err) => {
            if (err) return next(err);
            req.session.destroy((err) => {
                if (err) return next(err);
                res.clearCookie("connect.sid");
                res.redirect("/");
            });
        });
    }

    async connectGoogle(req, res, next) {
        if (!req.isAuthenticated()) return res.redirect("/login");
        req.session.connectMode = true;
        passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
    }

    async connectDiscord(req, res, next) {
        if (!req.isAuthenticated()) return res.redirect("/login");
        req.session.connectMode = true;
        passport.authenticate("discord")(req, res, next);
    }

    async connectSteam(req, res, next) {
        if (!req.isAuthenticated()) return res.redirect("/login");
        req.session.connectMode = true;
        passport.authenticate("steam")(req, res, next);
    }

    async getRequestIdentity(req, res) {
        const { OK, NO_CONTENT, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

        if (!req.isAuthenticated()) {
            return Response.send(res, NO_CONTENT, { message: "Requester is not logged in." });
        }

        const { data: dbUser, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", req.user.id)
            .single();

        if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });

        return Response.send(res, OK, { user: dbUser });
    }

    async upsertUser(profile, provider) {
        const providerId = provider === "steam" ? profile.identifier : profile.id;

        let user = null;
        // Check if the provider is connected to a specific user
        const { data: linkedProvider } = await supabase
            .from("user_providers")
            .select("user_id")
            .eq("provider", provider)
            .eq("provider_id", providerId)
            .single();

        // If valid, get the foreign ID for user
        if (linkedProvider) {
            console.log("its linking :3", linkedProvider);
            const { data: linkedUser } = await supabase
                .from("users")
                .select("*")
                .eq("id", linkedProvider.user_id)
                .single();
            user = linkedUser;
        }

        const avatar_url = (() => {
            switch (provider) {
                case "steam":
                    return profile.photos?.length ? profile.photos.at(-1).value : null;
                case "google": {
                    const avatar = profile.photos?.length ? profile.photos.at(-1).value : null;
                    return avatar.replace(/=s\d+-c$/, "=s512-c");
                }
                case "discord": {
                    const avatar = profile.avatar;
                    if (!avatar)
                        return `https://cdn.discordapp.com/embed/avatars/${profile.discriminator % 6}.png`;
                    const ext = avatar.startsWith("a_") ? "gif" : "png";
                    return `https://cdn.discordapp.com/avatars/${providerId}/${avatar}.${ext}?size=512`;
                }
                default:
                    return null;
            }
        })();

        const email = provider === "google" ? profile.emails?.[0]?.value : null;

        // Update user
        if (user) {
            await supabase
                .from("users")
                .update({
                    display_name: profile.displayName,
                    avatar_url,
                    email,
                    last_login: new Date(),
                })
                .eq("id", user.id);
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

            user = newUser;

            // Create empty board
            await supabase.from("boards").insert({ owner_id: user.id });
        }

        return user;
    }

    async connectProvider(userId, profile, provider) {
        const providerId = provider === "steam" ? profile.identifier : profile.id;

        await supabase.from("user_providers").insert({
            user_id: userId,
            provider,
            provider_id: providerId,
        });
    }
}
