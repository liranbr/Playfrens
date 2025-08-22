import express from "express";
import session from "express-session";
import cors from "cors";
import dotenv from "dotenv-safe";
import { SteamGridDBService } from "./services/steamgriddb.js";
import { SteamWebService } from "./services/steamweb.js";
import passport from "passport";
import SteamStrategy from "passport-steam";
import { Response } from "./response.js";

const app = express();
const PORT = 3000;
const services = [];

dotenv.config({ debug: true });

app.use(cors()); // allow frontend to call backend during dev

app.get("/api/hello", (_, res) => res.status(200).send({ message: "Hello from Playfrens! 🕹️" }));
app.listen(PORT, () => {
    console.log(`Listening to http://localhost:${PORT}`);
});

const URL = "http://localhost:3000";

// Session
app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true, // http vs https
            httpOnly: true,
            sameSite: "lax",
            maxAge: 24 * 60 * 60 * 1000, // one day
        },
    }),
);

// Steam
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

passport.use(
    new SteamStrategy(
        {
            returnURL: `${URL}/auth/steam/return`,
            realm: `${URL}/`,
            apiKey: process.env.STEAM_WEB_API_KEY,
        },
        (identifier, profile, done) => {
            process.nextTick(() => {
                profile.identifier = identifier;
                return done(null, profile);
            });
        },
    ),
);

app.get("/auth/steam", passport.authenticate("steam", { failureRedirect: "/" }));

app.get(
    "/auth/steam/return",
    passport.authenticate("steam", { failureRedirect: "/" }),
    (req, res) => {
        console.log(`Hello, ${req.user.displayName || "Steam user"}!`);
        res.redirect("https://localhost:5174/api/me");
    },
);

app.get("/api/me", (req, res) => {
    const { OK, UNAUTHORIZED } = Response.HttpStatus;
    if (req.isAuthenticated()) {
        Response.send(res, OK, { user: req.user });
        res.json();
    } else {
        Response.send(res, UNAUTHORIZED, { error: "Not logged in" });
    }
});

export const main = () => {
    services.push(new SteamGridDBService(app));
    services.push(new SteamWebService(app));
};

main();
