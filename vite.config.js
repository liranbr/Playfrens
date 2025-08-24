import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), mkcert()],
    server: {
        host: "0.0.0.0",
        port: 5174, // for developing - stable is running on 5173
        https: true,
        sourcemap: true,
        proxy: {
            "/auth": {
                target: "https://localhost:3000",
                changeOrigin: true,
                // Notice! This is by default should be true which results in denying self-signed certificates from being used.
                // but since we are doing a selfsigned certs for our backend this will be set to false momentarily!
                secure: false,
                cookieDomainRewrite: "localhost",
            },
            "/api": {
                target: "https://localhost:3000",
                changeOrigin: true,
                // ditto
                secure: false,
                cookieDomainRewrite: "localhost",
            },
        },
    },
    resolve: {
        alias: {
            "@": "/src",
        },
    },
});
