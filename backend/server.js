import express from "express";
import cors from "cors";
import dotenv from "dotenv-safe";
import { SteamGridDBService } from "./services/steamgriddb.js";
import { SteamWebService } from "./services/steamweb.js";
import { LoginService } from "./services/login.js";
import session from "express-session";
import passport from "passport";
import https from "https";
import selfsigned from "selfsigned";
import { SETTINGS } from "./settings.js";

const app = express();
const PORT = SETTINGS.PORT;

const services = [];

const pems = selfsigned.generate([{ name: "commonName", value: "localhost" }], { days: 365 });

dotenv.config({ debug: true });

app.use(
    cors({
        origin: "https://localhost:5174",
        credentials: true,
    }),
);

app.get("/", (_, res) => res.status(200).send("Hello from Playfrens! 🕹️"));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true, // http vs https
            httpOnly: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000, // one day
        },
    }),
);

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

export const main = () => {
    services.push(new LoginService(app));
    services.push(new SteamGridDBService(app));
    services.push(new SteamWebService(app));
};

main();

https.createServer({ key: pems.private, cert: pems.cert }, app).listen(PORT, () => {
    console.log(`HTTPS server running @ https://localhost:${PORT}`);
});
