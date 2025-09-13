import { Service } from "../service.js";
import { Response } from "../response.js";
import SteamStrategy from "passport-steam";
import passport from "passport";
import { getBackendDomain, getFrontendDomain } from "../utils.js";

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
        this.registerRoutes([
            {
                method: "get",
                path: "/auth/me",
                handler: this.getRequestIdentity.bind(this),
            },
            {
                method: "get",
                path: "/auth/logout",
                handler: this.logout.bind(this),
            },
            {
                method: "get",
                path: "/auth/steam",
                handler: passport.authenticate("steam", { failureRedirect: "/" }),
            },
            {
                method: "get",
                path: "/auth/steam/return",
                handler: [
                    passport.authenticate("steam", { failureRedirect: "/" }),
                    this.steamReturn.bind(this),
                ],
            },
        ]);
    }

    async logout(req, res, next) {
        const { UNAUTHORIZED } = Response.HttpStatus;

        if (!req.isAuthenticated()) {
            return Response.send(res, UNAUTHORIZED, { error: "Not logged in" });
        }
        console.log(`Logging out ${req.user.displayName} 🚪`);
        req.logout((err) => {
            if (err) return next(err);
            req.session.destroy((err) => {
                if (err) return next(err);
                res.clearCookie("connect.sid"); // maybe a better way to centeralize all cookies to be a specific key name and not this?
                res.redirect("/");
            });
        });
    }

    // Returns the user's information used to login with (e.g. Steam public data)
    async getRequestIdentity(req, res) {
        const { OK, UNAUTHORIZED } = Response.HttpStatus;

        if (req.isAuthenticated()) {
            Response.send(res, OK, { user: req.user });
            res.json();
        } else {
            Response.send(res, UNAUTHORIZED, { error: "Not logged in" });
        }
    }

    async steamReturn(req, res) {
        console.log(`Hello, ${req.user?.displayName || "Steam user"}!`);
        res.redirect(getFrontendDomain());
    }
}
