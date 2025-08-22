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
                target: "http://localhost:3000",
                changeOrigin: true,
                secure: false,
                cookieDomainRewrite: "localhost",
            },
            "/api": {
                target: "http://localhost:3000",
                changeOrigin: true,
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
