const env = process.env;

export class ConsoleColors {
    static Reset = "\x1b[0m";
    static Bright = "\x1b[1m";
    static Dim = "\x1b[2m";
    static Underscore = "\x1b[4m";
    static Blink = "\x1b[5m";
    static Reverse = "\x1b[7m";
    static Hidden = "\x1b[8m";

    static FgBlack = "\x1b[30m";
    static FgRed = "\x1b[31m";
    static FgGreen = "\x1b[32m";
    static FgYellow = "\x1b[33m";
    static FgBlue = "\x1b[34m";
    static FgMagenta = "\x1b[35m";
    static FgCyan = "\x1b[36m";
    static FgWhite = "\x1b[37m";

    static BgBlack = "\x1b[40m";
    static BgRed = "\x1b[41m";
    static BgGreen = "\x1b[42m";
    static BgYellow = "\x1b[43m";
    static BgBlue = "\x1b[44m";
    static BgMagenta = "\x1b[45m";
    static BgCyan = "\x1b[46m";
    static BgWhite = "\x1b[47m";

    static FgRGB(r, g, b) {
        return `\x1b[38;2;${r};${g};${b}m`;
    }
    static BgRGB(r, g, b) {
        return `\x1b[48;2;${r};${g};${b}m`;
    }
}

export function getFrontendDomain() {
    return `http${strToBool(env.USE_HTTPS) ? "s" : ""}://${env.DOMAIN}:5174`;
}

export function getBackendDomain() {
    return `http${strToBool(env.USE_HTTPS) ? "s" : ""}://${env.DOMAIN}:${env.BACKEND_PORT}`;
}

// Returns environment url or the backend, whichever is defined.
// 'target' may be "frontend" or "backend" — used as a fallback when BASE_URL is not set.
export function resolveBaseURL(target = "backend") {
    if (process.env.BASE_URL) return process.env.BASE_URL;
    const t = target.toLowerCase();
    if (t === "frontend") return getFrontendDomain();
    return getBackendDomain();
}

export function strToBool(s) {
    const value = s.toLowerCase();
    const n = Number(s);
    return value === "true" || (!isNaN(n) && n > 0);
}

export async function isImageUrlValid(url) {
    try {
        const res = await fetch(url, { method: "HEAD" });
        return res.ok && res.headers.get("content-type")?.startsWith("image/");
    } catch {
        return false;
    }
}

export function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
