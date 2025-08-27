const env = process.env;

export function getFrontendDomain() {
    return `http${parseBoolean(env.Use_HTTPS) ? "s" : ""}://${env.DOMAIN}:${env.VITE_PORT}`;
}

export function getBackendDomain() {
    return `http${parseBoolean(env.Use_HTTPS) ? "s" : ""}://${env.DOMAIN}:${env.BACKEND_PORT}`;
}

export function parseBoolean(s) {
    const value = s.toLowerCase();
    return value === "true" || value === "1" || value === "yes";
}
