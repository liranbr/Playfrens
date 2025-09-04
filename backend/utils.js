const env = process.env;

export function getFrontendDomain() {
    return `http${parseBoolean(env.USE_HTTPS) ? "s" : ""}://${env.DOMAIN}:${env.VITE_PORT}`;
}

export function getBackendDomain() {
    return `http${parseBoolean(env.USE_HTTPS) ? "s" : ""}://${env.DOMAIN}:${env.BACKEND_PORT}`;
}

export function parseBoolean(s) {
    const value = s.toLowerCase();
    const n = Number(s);
    return value === "true" || (!isNaN(n) && n > 0);
}
