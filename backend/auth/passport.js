import "../env.js";
import passport from "passport";
import SteamStrategy from "passport-steam";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as DiscordStrategy } from "passport-discord";
import { v4 as uuidv4 } from "uuid";
import { resolveBaseURL } from "../utils.js";
import { supabase } from "../supabaseClient.js";
import { closeUserSockets } from "../ws/boardSocket.js";

const SHORT_ID_ATTEMPTS = 5;
function generateShortId() {
    return uuidv4().replace(/-/g, "").slice(0, 8);
}

// Inserts a new board with a fresh short_id, retrying a few times in case of a match,
// since short_id has a UNIQUE constraint, very unlikely 🤞
// Returns the created { id, short_id, name } row, or null if every attempt failed.
export async function insertBoard(ownerId, name = null) {
    let lastError;
    for (let attempt = 1; attempt <= SHORT_ID_ATTEMPTS; attempt++) {
        const { data, error } = await supabase
            .from("boards")
            .insert({ owner_id: ownerId, short_id: generateShortId(), name })
            .select("id, short_id, name")
            .single();
        if (!error) return data;
        lastError = error;
        if (error.code !== "23505") break; // not a unique-violation, retrying won't help
    }
    console.error("Error creating board:", lastError);
    return null;
}

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

function getProviderId(profile, provider) {
    switch (provider) {
        case "steam":
            return profile.identifier;
        case "google":
        case "discord":
        case "email":
            return profile.id;
        default:
            return undefined;
    }
}

function getDisplayName(profile, provider) {
    switch (provider) {
        // passport-discord has no "displayName" field, Discord calls this "global_name", but will fallback to username if it was never set.
        case "discord":
            return profile.global_name || profile.username;
        default:
            return profile.displayName;
    }
}

function getEmail(profile, provider) {
    switch (provider) {
        case "google":
            return profile.emails?.length ? profile.emails[0].value : null;
        case "discord":
            return profile.email ?? null;
        case "email":
            return profile.email;
        default:
            // For Steam, has no email.
            return null;
    }
}

function getAvatarUrl(profile, provider, providerId) {
    switch (provider) {
        case "steam":
            return profile.photos?.length ? profile.photos.at(-1).value : null;
        case "google": {
            const avatar = profile.photos?.length ? profile.photos.at(-1).value : null;
            if (!avatar) return null; // no profile photo set
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
}

// Updates an existing user row with new profile data, returns its id.
async function updateExistingUser(existingUser, fields) {
    const { error } = await supabase
        .from("users")
        .update({ ...fields, last_login: new Date() })
        .eq("id", existingUser.id);
    if (error) throw error;
    return existingUser.id;
}

// Inserts a new user row, optionally with a home board, returns its id.
async function insertNewUser(provider, providerId, fields, createHomeBoard) {
    const { data: newUser, error } = await supabase
        .from("users")
        .insert({ ...fields, provider, provider_id: providerId, last_login: new Date() })
        .select()
        .single();
    if (error) throw error;

    // Skipped for guest-only accounts, since they're made for one specific board, not their own.
    if (createHomeBoard) await insertBoard(newUser.id);

    return newUser.id;
}

export async function upsertUser(profile, provider, { createHomeBoard = true } = {}) {
    const providerId = getProviderId(profile, provider);

    const { data: existingUser } = await supabase
        .from("users")
        .select("*")
        .eq("provider", provider)
        .eq("provider_id", providerId)
        .single();

    const fields = {
        display_name: getDisplayName(profile, provider),
        email: getEmail(profile, provider),
        avatar_url: getAvatarUrl(profile, provider, providerId),
    };

    const userId = existingUser
        ? await updateExistingUser(existingUser, fields)
        : await insertNewUser(provider, providerId, fields, createHomeBoard);

    const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
    if (userError) throw userError;

    return user;
}

// Deletes every guest account tied to this board (home_board_id) and kicks their live connection.
// Important when a board is deleted or the owner deleted their account.
export async function removeOrphanedBoardGuests(boardId, reason) {
    const { data: guests } = await supabase.from("users").select("*").eq("home_board_id", boardId);
    for (const guest of guests ?? []) {
        try {
            await deleteUserAccountRow(guest);
            closeUserSockets(guest.id, reason);
        } catch (err) {
            console.error(`Error deleting orphaned guest account ${guest.id}:`, err);
        }
    }
}

export async function deleteUserAccountRow(user) {
    // Boards owned by this user cascade-delete once their row is removed below, so clean up
    // guest accounts first or those logins would outlive the boards they were made for.
    const { data: ownedBoards } = await supabase
        .from("boards")
        .select("id")
        .eq("owner_id", user.id);
    for (const board of ownedBoards ?? []) {
        await removeOrphanedBoardGuests(board.id, "The board this login was for was deleted.");
    }

    if (user.provider === "email") {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.provider_id);
        if (authDeleteError) throw authDeleteError;
    }

    const { error: deletionError } = await supabase.from("users").delete().eq("id", user.id);
    if (deletionError) throw deletionError;

    const { error: cleanupError } = await supabase.rpc("remove_user_from_all_boards", {
        _user_id: user.id,
    });
    if (cleanupError) console.error("Error cleaning up board memberships:", cleanupError);

    invalidateUserCache(user.id);
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
