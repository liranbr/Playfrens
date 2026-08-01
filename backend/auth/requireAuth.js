import { Response } from "../response.js";

/** Middleware that guards a route (or router) behind login. */
export function requireAuth(req, res, next) {
    if (!req.isAuthenticated()) {
        return Response.sendUnauthenticated(res);
    }
    next();
}

