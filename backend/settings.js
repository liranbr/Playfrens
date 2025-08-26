export const SETTINGS = {
    DOMAIN: "localhost",
    PORT: 3000,
    HTTPS: true,
};

export function getBackendDomain() {
    return `http${SETTINGS.HTTPS ? "s" : ""}://${SETTINGS.DOMAIN}:${SETTINGS.PORT}`;
}
