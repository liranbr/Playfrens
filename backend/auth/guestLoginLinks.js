import "../env.js";
import crypto from "node:crypto";
import { supabase } from "../supabaseClient.js";

const TOKEN_BYTES = 24; // 32 base64url characters
const MAX_TOKEN_LENGTH = 64;
// Encrypted so the owner can copy a link again, a database dump alone can't.
const ENCRYPTION_KEY = Buffer.from(
    crypto.hkdfSync("sha256", process.env.SESSION_SECRET, "", "guest-login-links", 32),
);

function hashLoginToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
}

function encryptToken(token) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map((b) => b.toString("base64url")).join(".");
}

// Null if it can't be decrypted, e.g. after SESSION_SECRET changed.
function decryptToken(stored) {
    try {
        const [iv, tag, encrypted] = stored.split(".").map((p) => Buffer.from(p, "base64url"));
        const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
    } catch {
        return null;
    }
}

// Replaces the previous link.
export async function createGuestLoginLink(guestId) {
    const token = crypto.randomBytes(TOKEN_BYTES).toString("base64url");
    const { error } = await supabase.from("guest_login_links").upsert({
        guest_id: guestId,
        token_hash: hashLoginToken(token),
        token_encrypted: encryptToken(token),
        created_at: new Date().toISOString(),
    });
    if (error) throw error;
    return { token };
}

// Null if the guest has no link, { token: null } if it exists but can't be read back.
export async function getGuestLoginLink(guestId) {
    const { data, error } = await supabase
        .from("guest_login_links")
        .select("token_encrypted")
        .eq("guest_id", guestId)
        .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return { token: data.token_encrypted ? decryptToken(data.token_encrypted) : null };
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
