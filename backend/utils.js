import dotenv from "dotenv-safe";
dotenv.config({ debug: true, path: ".env" });
dotenv.config({ debug: true, path: ".env.public" });

const env = process.env;

export function getFrontendDomain() {
    return `http${env.Use_HTTPS ? "s" : ""}://${env.DOMAIN}:${env.VITE_PORT}`;
}

export function getBackendDomain() {
    return `http${env.Use_HTTPS ? "s" : ""}://${env.DOMAIN}:${env.BACKEND_PORT}`;
}
