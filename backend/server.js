import "./env.js"; // Load environment keys first before anything else!
import express from "express";
import cors from "cors";
import compression from "compression";
import session from "express-session";
import passport from "passport";
import https from "https";
import selfsigned from "selfsigned";
import path from "path";
import { fileURLToPath } from "url";
import { ConsoleColors, logRoutes, resolveBaseURL, strToBool } from "./utils.js";
import { configurePassport } from "./auth/passport.js";
import { SupabaseSessionStore } from "./auth/SupabaseSessionStore.js";
import generalRoutes from "./routes/general.js";
import authRoutes from "./routes/auth.js";
import steamRoutes from "./routes/steam.js";
import steamgriddbRoutes from "./routes/steamgriddb.js";
import boardRoutes from "./routes/board.js";

// === Support for __dirname in ES modules ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env;
const isProduction = env.NODE_ENV === "production";

function resolveUseHttps() {
    if (isProduction) return false;
    if (env.SELF_SIGN_HTTPS === undefined) {
        throw new Error("SELF_SIGN_HTTPS must be defined outside production");
    }
    return strToBool(env.SELF_SIGN_HTTPS);
}
const useHttps = resolveUseHttps();

// Init express
const app = express();
app.set("trust proxy", 1);

app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

// Enable Cross-Origin Resource Sharing
app.use(
    cors({
        origin: resolveBaseURL(),
        credentials: true,
    }),
);

// Sessions + Passport
app.use(
    session({
        store: new SupabaseSessionStore(),
        secret: env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: "auto",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 180 * 24 * 60 * 60 * 1000, // 180 days
        },
    }),
);
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// Routes
const mounts = [
    ["/api", generalRoutes, "general.js"],
    ["/auth", authRoutes, "auth.js"],
    ["/api/steam", steamRoutes, "steam.js"],
    ["/api/steamgriddb", steamgriddbRoutes, "steamgriddb.js"],
    ["/api/board", boardRoutes, "board.js"],
];
for (const [prefix, router, label] of mounts) {
    app.use(prefix, router);
    logRoutes(prefix, router, label);
}

// NOTICE: The following 2 calls down below assumes we have a public folder for server.js
// In normal development, we use Vite instead, making both of these only functional when publishing.
// Serve static frontend build
app.use(express.static(path.join(__dirname, "public")));

// Fallback just in case of API routes falling apart
app.use((req, res, next) => {
    const apiPrefixes = ["/api", "/auth"];
    if (apiPrefixes.some((prefix) => req.path.startsWith(prefix))) {
        return next(); // let backend handle these
    }
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Error logging listener after everything initialized
// eslint-disable-next-line no-unused-vars -- Express only treats a 4-arg function as error-handling middleware
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: err.message });
});

const createHttpsServer = (app) => {
    const pems = selfsigned.generate([{ name: "commonName", value: env.DOMAIN }], {
        days: 365,
        keySize: 2048,
    });
    return https.createServer({ key: pems.private, cert: pems.cert }, app);
};

(useHttps ? createHttpsServer(app) : app).listen(env.BACKEND_PORT, env.DOMAIN, () => {
    console.log(
        `${ConsoleColors.FgRGB(191, 255, 0)} Playfrens server running @ ${resolveBaseURL()}${ConsoleColors.Reset}`,
    );
});
