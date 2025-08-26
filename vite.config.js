import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";
import dotenv from "dotenv";

dotenv.config({ path: ".env.public" });

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const { VITE_PORT, USE_HTTPS, BACKEND_PORT, DOMAIN } = env;

    const target = `http${Boolean(USE_HTTPS) ? "s" : ""}://${DOMAIN}:${BACKEND_PORT}`;
    console.log("target", target);
    return {
        plugins: [react(), mkcert()],
        server: {
            host: "0.0.0.0",
            port: Number(VITE_PORT), // for developing - stable is running on 5173
            https: Boolean(USE_HTTPS),
            sourcemap: true,
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
    };
});
