import express from "express";
import cors from "cors";
import dotenv from "dotenv-safe";
import { GeneralService } from "./services/general.js";
import { LoginService } from "./services/login.js";
import { SteamGridDBService } from "./services/steamgriddb.js";
import { SteamWebService } from "./services/steam.js";
import session from "express-session";
import passport from "passport";
import https from "https";
import selfsigned from "selfsigned";
import path from "path";
import { fileURLToPath } from "url";
import { ConsoleColors, getBackendDomain, getFrontendDomain, strToBool } from "./utils.js";

// === Support for __dirname in ES modules ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment keys first before anything else!
dotenv.config({ debug: true, path: ".env" });
dotenv.config({ debug: true, path: ".env.public" });
const env = process.env;

// Init express
const app = express();

// Enable Cross-Origin Resource Sharing
app.use(
    cors({
        origin: getFrontendDomain(),
        credentials: true,
    }),
);

// For login purposes, see ./services/login.js
// Allows express to manage sessions
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: strToBool(env.USE_HTTPS), // http vs https
            httpOnly: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        },
    }),
);

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Holds all services we provide into classes
const services = [];
export const main = () => {
    services.push(new GeneralService(app));
    services.push(new LoginService(app));
    services.push(new SteamGridDBService(app));
    services.push(new SteamWebService(app));
};

// Finally we set up the server to be ready and listening
if (strToBool(env.USE_HTTPS)) {
    const pems = selfsigned.generate([{ name: "commonName", value: "localhost" }], {
        days: 365,
        keySize: 2048,
    });
    https.createServer({ key: pems.private, cert: pems.cert }, app).listen(env.BACKEND_PORT, () => {
        console.log(`${ConsoleColors.FgRGB(191, 255, 0)} Playfrens HTTPS server running @ ${getBackendDomain()}${ConsoleColors.Reset}`);
    });
} else {
    app.listen(env.PORT, () => {
        console.log(`${ConsoleColors.FgRGB(191, 255, 0)} Playfrens HTTP server running @ ${getBackendDomain()}${ConsoleColors.Reset}`);
    });
}

main();

// Serve static frontend build
app.use(express.static(path.join(__dirname, "public")));

// SPA fallback — only for non-API routes
app.use((req, res, next) => {
    const apiPrefixes = ["/api", "/auth"];
    if (apiPrefixes.some(prefix => req.path.startsWith(prefix))) {
        return next(); // let backend handle these
    }
    res.sendFile(path.join(__dirname, "public", "index.html"));
});


// Error logging listener after everything initialized
app.use(async (err, _req, res, _next) => {
    res.status(500).json({ error: err.message });
});
