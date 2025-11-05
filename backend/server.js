import express from "express";
import cors from "cors";
import dotenv from "dotenv-safe";
import { GeneralService } from "./services/general.js";
import { LoginService } from "./services/login.js";
import { SteamGridDBService } from "./services/steamgriddb.js";
import { SteamWebService } from "./services/steam.js";
import https from "https";
import selfsigned from "selfsigned";
import path from "path";
import { fileURLToPath } from "url";
import { ConsoleColors, resolveBaseURL, strToBool } from "./utils.js";
import { createClient } from "@supabase/supabase-js";

// === Support for __dirname in ES modules ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment keys first before anything else!
dotenv.config({ debug: true, path: ".env" });
dotenv.config({ debug: true, path: ".env.public" });
const env = process.env;

export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

// Init express
const app = express();
app.set("trust proxy", 1);

const isProd = process.env.NODE_END === "production";
app.locals.isProd = isProd;

// Holds all services we provide into classes
const services = [];

// Enable Cross-Origin Resource Sharing
app.use(
    cors({
        origin: resolveBaseURL("frontend"),
        credentials: true,
    }),
);

export const main = () => {
    // Initialize all services
    app.locals.services = Object.freeze({
        general: new GeneralService(app),
        login: new LoginService(app),
        steam: new SteamWebService(app),
        steamgriddb: new SteamGridDBService(app),
    });

    // Listen afterwards.
    for (const svc of Object.values(app.locals.services)) {
        if (typeof svc.listen === "function") svc.listen();
    }

    // Push all the services we provide.
    services.push(...Object.values(app.locals.services));

    // Production should not release with HTTPS, this is mostly for testing purposes.
    const makeHTTPS = (app) => {
        const pems = selfsigned.generate([{ name: "commonName", value: env.DOMAIN }], {
            days: 365,
            keySize: 2048,
        });
        return https.createServer({ key: pems.private, cert: pems.cert }, app);
    };
    // First we set up the server to be ready and listening
    const isHTTPS = strToBool(env.USE_HTTPS);
    (isHTTPS ? makeHTTPS(app) : app).listen(env.BACKEND_PORT, env.DOMAIN, () => {
        console.log(
            `${ConsoleColors.FgRGB(191, 255, 0)} Playfrens server running @ ${resolveBaseURL()}${ConsoleColors.Reset}`,
        );
    });

    // NOTICE: The follow 2 calls down below assumes we have a public folder for server.js
    // In normal development, we use Vite instead, making both of these only functional when publishing.
    // Serve static frontend build
    app.use(express.static(path.join(__dirname, "public")));

    // SPA fallback — only for non-API routes
    app.use((req, res, next) => {
        const apiPrefixes = ["/api", "/auth"];
        if (apiPrefixes.some((prefix) => req.path.startsWith(prefix))) {
            return next(); // let backend handle these
        }
        res.sendFile(path.join(__dirname, "public", "index.html"));
    });

    // Error logging listener after everything initialized
    app.use(async (err, _req, res) => {
        res.status(500).json({ error: err.message });
    });
};

main();
