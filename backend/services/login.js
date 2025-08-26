import { Service } from "../service.js";
import { Response } from "../response.js";
import SteamStrategy from "passport-steam";
import passport from "passport";
import { getBackendDomain } from "../settings.js";

export class LoginService extends Service {
    constructor(app) {
        super(app, process.env.SESSION_SECRET);

        const URL = getBackendDomain();
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
    }
    listen() {
        super.listen();
        this.app.get("/auth/me", this.getMe.bind(this));
        this.app.get("/auth/logout", this.logout.bind(this));

        this.app.get("/auth/steam", passport.authenticate("steam", { failureRedirect: "/" }));
        this.app.get(
            "/auth/steam/return",
            passport.authenticate("steam", { failureRedirect: "/" }),
            (req, res) => {
                console.log(`Hello, ${req.user.displayName || "Steam user"}!`);
                res.redirect("https://localhost:5174");
            },
        );
    }

    async logout(req, res, next) {
        const { UNAUTHORIZED } = Response.HttpStatus;
        if (!req.isAuthenticated()) {
            return Response.send(res, UNAUTHORIZED, { error: "Not logged in" });
        }
        console.log(`Logging out ${req.user.displayName} 🚪`);
        req.logout(function (err) {
            if (err) {
                return next(err);
            }
            req.session.destroy((err) => {
                if (err) return next(err);
                res.clearCookie("connect.sid"); // maybe a better way to centeralize all cookies to be a specific key name and not this?
                res.redirect("/");
            });
        });
    }

    async getMe(req, res) {
        const { OK, UNAUTHORIZED } = Response.HttpStatus;
        if (req.isAuthenticated()) {
            Response.send(res, OK, { user: req.user });
            res.json();
        } else {
            Response.send(res, UNAUTHORIZED, { error: "Not logged in" });
        }
    }
}
