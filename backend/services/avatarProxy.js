import { Response } from "../response.js";
import { strToBool } from "../utils.js";

// Providers whose avatar URLs we're willing to fetch server-side.
const ALLOWED_AVATAR_HOSTS = [
    "lh3.googleusercontent.com",
    "cdn.discordapp.com",
    "avatars.steamstatic.com",
    "avatars.akamai.steamstatic.com",
];

// Kill switch: set to false to redirect straight to the DB's avatar URL instead of proxying.
const AVATAR_PROXY_ENABLED = strToBool(process.env.AVATAR_PROXY_ENABLED) ?? true;

// TODO: swap these Maps for a real cache (Redis or similar), they grow unbounded and
// reset on every restart/deploy, which is really bad for in long-term.
// This project will not go viral, right? Right???
const AVATAR_CACHE_LIFETIME_MS = 60 * 60 * 1000; // 1 hour
const avatarCache = new Map(); // userId -> { buffer, contentType, expiresAt }
const avatarFetches = new Map(); // userId -> in-flight fetch promise, to avoid double and more requests

async function fetchAvatar(avatarUrl) {
    const upstream = await fetch(avatarUrl);
    if (!upstream.ok) throw new Error(`Provider responded with ${upstream.status}`);
    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await upstream.arrayBuffer());
    return { buffer, contentType, expiresAt: Date.now() + AVATAR_CACHE_LIFETIME_MS };
}

export async function getAvatar(req, res) {
    const { OK, NOT_FOUND, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

    if (!req.isAuthenticated() || !req.user.avatar_url) {
        return Response.send(res, NOT_FOUND, { error: "No avatar available." });
    }

    if (!AVATAR_PROXY_ENABLED) {
        return res.redirect(req.user.avatar_url);
    }

    let host;
    try {
        host = new URL(req.user.avatar_url).host;
    } catch {
        return Response.send(res, NOT_FOUND, { error: "Invalid avatar URL." });
    }
    if (!ALLOWED_AVATAR_HOSTS.includes(host)) {
        return Response.send(res, NOT_FOUND, { error: "Unsupported avatar host." });
    }

    const userId = req.user.id;
    const cached = avatarCache.get(userId);

    if (cached && cached.expiresAt > Date.now()) {
        res.set("Content-Type", cached.contentType);
        res.set("Cache-Control", "private, max-age=3600");
        return Response.sendMessage(res, OK, cached.buffer);
    }

    try {
        // Dedupe concurrent requests for the same user into a single upstream fetch.
        let fetchPromise = avatarFetches.get(userId);
        if (!fetchPromise) {
            fetchPromise = fetchAvatar(req.user.avatar_url).finally(() =>
                avatarFetches.delete(userId),
            );
            avatarFetches.set(userId, fetchPromise);
        }
        const fresh = await fetchPromise;
        avatarCache.set(userId, fresh);

        res.set("Content-Type", fresh.contentType);
        res.set("Cache-Control", "private, max-age=3600");
        return Response.sendMessage(res, OK, fresh.buffer);
    } catch (err) {
        console.error("Error fetching avatar:", err);
        // Provider is rate-limiting/unavailable, so fall back to the last known-good copy if it exist.
        if (cached) {
            res.set("Content-Type", cached.contentType);
            res.set("Cache-Control", "private, max-age=60");
            return Response.sendMessage(res, OK, cached.buffer);
        }
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: "Error fetching avatar." });
    }
}
