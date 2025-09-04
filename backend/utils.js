const env = process.env;

export function getFrontendDomain() {
    return `http${strToBool(env.USE_HTTPS) ? "s" : ""}://${env.DOMAIN}:${env.VITE_PORT}`;
}

export function getBackendDomain() {
    return `http${strToBool(env.USE_HTTPS) ? "s" : ""}://${env.DOMAIN}:${env.BACKEND_PORT}`;
}

export function strToBool(s) {
    const value = s.toLowerCase();
    const n = Number(s);
    return value === "true" || (!isNaN(n) && n > 0);
}
