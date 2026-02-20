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
                    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
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
        passport.use(
            new DiscordStrategy(
                {
                    clientID: process.env.DISCORD_CLIENT_ID,
                    clientSecret: process.env.DISCORD_CLIENT_SECRET,
                    callbackURL: `${URL}/auth/discord/callback`,
                    scope: ["identify"],
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        console.log(profile);
                        const user = await this.upsertUser(profile, "discord");
                        done(null, user);
                    } catch (err) {
                        done(err);
                    }
                },
            ),
        );
    }
    listen() {
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
                passport.authenticate(provider, {
                    failureRedirect: loginFailedRoute,
                }),
                this.loginCallback.bind(this),
            ],
        });

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
            {
                method: "delete",
                path: "/auth/deleteAccount",
                handler: this.deleteAccount.bind(this),
            },
            // Login Routers
            loginRoute("steam"),
            loginRoute("google", { scope: ["profile", "openid", "email"] }),
            loginRoute("discord"),
            // Strategy Callbacks
            loginCallbackRoute("steam", "return"),
            loginCallbackRoute("google", "callback"),
            loginCallbackRoute("discord", "callback"),
            // Google and Discord - if renamed, update accordingly in the respective developer portal
        ]);
    }

    // Return function called after successful login
    async loginCallback(req, res) {
        console.log(`Hello, ${req.user?.display_name} from ${req.user?.provider}! 👋`);
        res.redirect("/app");
    }

    // Logs out the current user
    async logout(req, res, next) {
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

    async upsertUser(profile, provider) {
        const providerId = (() => {
            switch (provider) {
                case "steam":
                    return profile.identifier;
                case "google":
                case "discord":
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

        const avatar_url = (() => {
            switch (provider) {
                case "steam":
                    return profile.photos?.length ? profile.photos.at(-1).value : null;
                case "google": {
                    const avatar = profile.photos?.length ? profile.photos.at(-1).value : null;
                    // Give the maximum size of most google avatars, 512x512.
                    return avatar.replace(/=s\d+-c$/, "=s512-c");
                }
                case "discord": {
                    const avatar = profile.avatar;
                    if (!avatar) {
                        // Avatarless users uses 0 - 5 variations of avatars via discriminator value
                        return `https://cdn.discordapp.com/embed/avatars/${profile.discriminator % 6}.png`;
                    }
                    // For animated avatars
                    const ext = avatar.startsWith("a_") ? "gif" : "png";
                    return `https://cdn.discordapp.com/avatars/${providerId}/${avatar}.${ext}?size=512`;
                }
                default:
                    return null;
            }
        })();

        const email = (() => {
            switch (provider) {
                case "google":
                    return profile.emails?.[0]?.value;
                // case "discord":
                // return profile.email;
                default:
                    return null;
            }
        })();

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
            console.log(email);
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

    // Deletes the user upon a Delete Account request
    async deleteAccount(req, res) {
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
}
