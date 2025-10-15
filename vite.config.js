import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";
import dotenv from "dotenv";

dotenv.config({ path: ".env.public" });

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const { USE_HTTPS, DOMAIN } = env;

    const parseBoolean = (s) => {
        const value = s.toLowerCase();
        return value === "true" || value === "1" || value === "yes";
    };
    const useHttps = parseBoolean(USE_HTTPS);

    const target = `${useHttps ? "https" : "http"}://${DOMAIN}:3000`;

    return {
        plugins: [react(), useHttps ? mkcert() : undefined],
        server: {
            host: "0.0.0.0",
            port: 5174, // for developing - stable is running on 5173
            https: useHttps,
            sourcemap: true,
            allowedHosts: "playfrens.onrender.com",
            proxy: {
                "/auth": {
                    target: target,
                    changeOrigin: true,
                    // Notice! This is by default should be true which results in denying self-signed certificates from being used.
                    // but since we are doing a selfsigned certs for our backend this will be set to false momentarily!
                    secure: false,
                    cookieDomainRewrite: DOMAIN,
                },
                "/api": {
                    target: target,
                    changeOrigin: true,
                    // ditto
                    secure: false,
                    cookieDomainRewrite: DOMAIN,
                },
            },
        },
        resolve: {
            alias: {
                "@": "/src",
            },
        },
        build: {
            outDir: "backend/public",
        },
    };
});
