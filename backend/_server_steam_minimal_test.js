import express from "express";
import session from "express-session";
import passport from "passport";
import SteamStrategy from "passport-steam";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

const URL = "http://localhost:3000";

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: false, // http vs https
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // one day
        },
    }),
);

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
        res.send(`Hello, ${req.user.displayName || "Steam user"}!`);
    },
);

app.get("/", (req, res) => {
    res.send(`
    <h1>Welcome to Steam Login</h1>
    <a href="/auth/steam">Login with Steam</a>
  `);
});

app.listen(PORT, () => {
    console.log(`Server listening at ${URL}`);
});
