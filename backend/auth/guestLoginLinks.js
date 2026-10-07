import crypto from "node:crypto";
import { supabase } from "../supabaseClient.js";

const TOKEN_BYTES = 24; // 32 base64url characters
const MAX_TOKEN_LENGTH = 64;

function hashLoginToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

// Replaces the previous link, only the token's hash is stored.
export async function createGuestLoginLink(guestId) {
    const token = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
    const { error } = await supabase.from("guest_login_links").upsert({
        guest_id: guestId,
        token_hash: hashLoginToken(token),
        created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { token };
}

// Links don't expire. Returns the guest's id, or null.
export async function findGuestIdByLoginToken(token) {
    if (typeof token !== "string" || !token || token.length > MAX_TOKEN_LENGTH) return null;
    const { data, error } = await supabase
        .from("guest_login_links")
        .select("guest_id")
        .eq("token_hash", hashLoginToken(token))
        .maybeSingle();
    if (error) throw error;
    return data?.guest_id ?? null;
}

export async function cancelGuestLoginLink(guestId) {
    const { error } = await supabase.from("guest_login_links").delete().eq("guest_id", guestId);
    if (error) throw error;
}
