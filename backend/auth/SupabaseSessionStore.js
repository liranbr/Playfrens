import { Store } from "express-session";
import { supabase } from "../supabaseClient.js";

const DEFAULT_PRUNE_INTERVAL = 15 * 60 * 1000; // 15 Minutes

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
        supabase
            .from("sessions")
            .select("sess, expires")
            .eq("sid", sid)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) return callback(error);
                if (!data || new Date(data.expires) <= new Date()) return callback(null, null);
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

