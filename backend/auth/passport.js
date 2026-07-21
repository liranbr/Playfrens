import "../env.js";
import passport from "passport";
import SteamStrategy from "passport-steam";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as DiscordStrategy } from "passport-discord";
import { resolveBaseURL } from "../utils.js";
import { supabase } from "../supabaseClient.js";

// Short cache for deserializeUser, since it runs on every authenticated request.
const USER_CACHE_LIFETIME_SECS = 120; // 2 minutes
const userCache = new Map(); // userId -> { user, expiresAt }

// Call after deleting a user's row, so other active sessions for the account stop working immediately.
export function invalidateUserCache(userId) {
    userCache.delete(userId);
}

// Removes expired entries on every write instead of a timer, so lapsed users don't last forever.
function pruneUserCache() {
    const now = Date.now();
    for (const [id, entry] of userCache) {
        if (entry.expiresAt <= now) userCache.delete(id);
    }
}

export async function upsertUser(profile, provider) {
    const providerId = (() => {
        switch (provider) {
            case "steam":
                return profile.identifier;
            case "google":
            case "discord":
            case "email":
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

    const display_name = (() => {
        switch (provider) {
            // passport-discord has no "displayName" field, Discord calls this "global_name", but will fallback to username if it was never set.
            case "discord":
                return profile.global_name || profile.username;
            default:
                return profile.displayName;
        }
    })();

    const email = (() => {
        switch (provider) {
            case "google":
                return profile.emails?.length ? profile.emails[0].value : null;
            case "discord":
                return profile.email ?? null;
            default:
                // For Steam, has no email.
                return null;
        }
    })();

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

    let userId;

    if (existingUser) {
        userId = existingUser.id;
        // Update user
        const { error: updateError } = await supabase
            .from("users")
            .update({
                display_name,
                email,
                avatar_url,
                email: profile.email,
                last_login: new Date(),
            })
            .eq("id", userId);
        if (updateError) throw updateError;
    } else {
        // Insert new user
        const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({
                display_name,
                email,
                avatar_url,
                email: profile.email,
                provider,
                provider_id: providerId,
                last_login: new Date(),
            })
            .select()
            .single();
        if (insertError) throw insertError;

        userId = newUser.id;

        // Create empty board
        const { error: boardError } = await supabase.from("boards").insert({ owner_id: userId });
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

// Wires up session (de)serialization and the OAuth strategies. Call once at startup.
export function configurePassport() {
    passport.serializeUser((user, done) => done(null, user.id));
    passport.deserializeUser(async (id, done) => {
        const cached = userCache.get(id);
        if (cached && cached.expiresAt > Date.now()) return done(null, cached.user);

        const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", id)
            .single();
        // No rows? Then account was deleted, treat as logged out instead of erroring.
        if (error) return done(error.code === "PGRST116" ? null : error, false);
        pruneUserCache();
        userCache.set(id, { user, expiresAt: Date.now() + USER_CACHE_LIFETIME_SECS * 1000 });
        done(null, user);
    });

    const URL = resolveBaseURL();

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
                    const user = await upsertUser(profile, "steam");
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
                state: true,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const user = await upsertUser(profile, "google");
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
                scope: ["identify", "email"],
                state: true,
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const user = await upsertUser(profile, "discord");
                    done(null, user);
                } catch (err) {
                    done(err);
                }
            },
        ),
    );
}

