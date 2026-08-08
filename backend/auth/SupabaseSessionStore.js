import { Store } from "express-session";
import { supabase } from "../supabaseClient.js";

const DEFAULT_PRUNE_INTERVAL = 15 * 60 * 1000; // 15 Minutes

// Short cache for get(), since it runs on every request.
// destroy() clears entries immediately so logout isn't delayed.
const SESSION_CACHE_LIFETIME_SECS = 120; // 2 minutes
const sessionCache = new Map(); // sid -> { sess, expiresAt }

// Sweeps expired entries on every write instead of a timer, so lapsed sessions don't last forever.
function pruneSessionCache() {
    const now = Date.now();
    for (const [sid, entry] of sessionCache) {
        if (entry.expiresAt <= now) sessionCache.delete(sid);
    }
}

/**
 * `express-session` Store backed by Supabase
 */
export class SupabaseSessionStore extends Store {
    constructor({ pruneIntervalMs = DEFAULT_PRUNE_INTERVAL } = {}) {
        super();
        this.pruneTimer = setInterval(() => this.#pruneExpired(), pruneIntervalMs);
        this.pruneTimer.unref();
    }

    async #pruneExpired() {
        const { error } = await supabase
            .from("sessions")
            .delete()
            .lt("expires", new Date().toISOString());
        if (error) console.error("Failed to prune expired sessions:", error);
    }

    get(sid, callback) {
        const cached = sessionCache.get(sid);
        if (cached && cached.expiresAt > Date.now()) return callback(null, cached.sess);

        supabase
            .from("sessions")
            .select("sess, expires")
            .eq("sid", sid)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) return callback(error);
                if (!data || new Date(data.expires) <= new Date()) return callback(null, null);
                pruneSessionCache();
                sessionCache.set(sid, {
                    sess: data.sess,
                    expiresAt: Date.now() + SESSION_CACHE_LIFETIME_SECS * 1000,
                });
                callback(null, data.sess);
            }, callback);
    }

    set(sid, session, callback) {
        supabase
            .from("sessions")
            .upsert({
                sid,
                sess: session,
                expires: new Date(session.cookie.expires).toISOString(),
            })
            .then(({ error }) => callback(error ?? null), callback);
    }

    destroy(sid, callback) {
        sessionCache.delete(sid);
        supabase
            .from("sessions")
            .delete()
            .eq("sid", sid)
            .then(({ error }) => callback(error ?? null), callback);
    }

    touch(sid, session, callback) {
        this.set(sid, session, callback);
    }
}
