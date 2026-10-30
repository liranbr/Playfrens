import "./env.js";
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

// Per-request Auth client, so Supabase rate limits the visitor's IP instead of ours.
export function supabaseAuthFor(req) {
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { headers: req.ip ? { "Sb-Forwarded-For": req.ip } : {} },
    });
}
