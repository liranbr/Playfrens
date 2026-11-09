import "./env.js"; // Load environment keys first before anything else!
import express from "express";
import cors from "cors";
import compression from "compression";
import session from "express-session";
import passport from "passport";
import http from "http";
import https from "https";
import selfsigned from "selfsigned";
import path from "path";
import { fileURLToPath } from "url";
import { ConsoleColors, logRoutes, resolveBaseURL, strToBool } from "./utils.js";
import { configurePassport } from "./auth/passport.js";
import { SupabaseSessionStore } from "./auth/SupabaseSessionStore.js";
import { attachBoardSocketServer } from "./ws/boardSocket.js";
import generalRoutes from "./routes/general.js";
import authRoutes from "./routes/auth.js";
import steamRoutes from "./routes/steam.js";
import steamgriddbRoutes from "./routes/steamgriddb.js";
import steamCatalogRoutes from "./routes/steamCatalog.js";
import boardsRoutes from "./routes/boards.js";
import { sanitizeDeep } from "#shared/sanitize.js";

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
app.set("query parser", (str) => sanitizeDeep(Object.fromEntries(new URLSearchParams(str))));

const DEBUG_ADHD_INFO_DUMPING = false;
if (DEBUG_ADHD_INFO_DUMPING)
    app.use((req, res, next) => {
        res.on("finish", () => {
            // don't say those, that's mean
            const { password, token, token_hash, access_token, ...body } = req.body ?? {};
            console.log(req.method, req.originalUrl, res.statusCode, { query: req.query, body });
        });
        next();
    });
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(express.json({ limit: "5mb" }));
app.use((req, _res, next) => {
    if (req.body) req.body = sanitizeDeep(req.body);
    next();
});

// Enable Cross-Origin Resource Sharing
app.use(
    cors({
        origin: resolveBaseURL(),
        credentials: true,
    }),
);

// Sessions + Passport
const sessionMiddleware = session({
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
});
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
configurePassport();

// Routes
const mounts = [
    ["/api", generalRoutes, "general.js"],
    ["/auth", authRoutes, "auth.js"],
    ["/api/steam", steamRoutes, "steam.js"],
    ["/api/steamgriddb", steamgriddbRoutes, "steamgriddb.js"],
    ["/api/steam/catalog", steamCatalogRoutes, "steamCatalog.js"],
    ["/api/boards", boardsRoutes, "boards.js"],
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
    const status = err.status ?? err.statusCode ?? 500;
    if (status >= 500) console.error(err);
    res.status(status).json({ error: err.expose ? err.message : "Internal server error" });
});

const createHttpsServer = (app) => {
    const pems = selfsigned.generate([{ name: "commonName", value: env.DOMAIN }], {
        days: 365,
        keySize: 2048,
    });
    return https.createServer({ key: pems.private, cert: pems.cert }, app);
};

const httpServer = useHttps ? createHttpsServer(app) : http.createServer(app);
attachBoardSocketServer(httpServer, { sessionMiddleware, passport });

httpServer.listen(env.BACKEND_PORT, env.DOMAIN, () => {
    const { FgCyan, Reset, success, url } = ConsoleColors;
    const baseURL = resolveBaseURL();
    console.log(
        `${success} Playfrens server running :)${Reset}\n` +
            `  ${FgCyan}[_]${Reset}     ${url}${baseURL}${Reset}\n` +
            `  ${FgCyan}[App]${Reset}   ${url}${baseURL}/app${Reset}\n` +
            `  ${FgCyan}[Login]${Reset} ${url}${baseURL}/login${Reset}`,
    );
});
