import { asyncHandler, ConsoleColors, resolveBaseURL } from "./utils.js";
/**
 * @typedef {import("./request.js").HttpMethod} HttpMethod
 */

/**
 * @class
 * @property {import('express').application} app
 */
export class Service {
    /** @type {string} */
    environment_key = "";
    /** @type {import('express').Express} */
    app;

    /**
     * @param {import('express').Express} app
     * @param {string} environment_key
     */
    constructor(app, environment_key = "") {
        this.app = app;
        this.environment_key = environment_key;
    }

    async connect() {
        return null;
    }

    listen() {
        const { FgYellow, Reset } = ConsoleColors;
        console.log(`${FgYellow}${this.constructor.name}${Reset}`);
    }

    /**
     * Helper to register multiple routes in a D.R.Y. way
     * @param {Array<{ method: HttpMethod, path: string, handler: Function }>} routes
     */
    registerRoutes(routes) {
        const { FgCyan, FgGreen, Reset, FgRGB } = ConsoleColors;
        for (const { method, path, handler } of routes) {
            const handlers = Array.isArray(handler) ? handler : [handler];
            this.app[method](path, ...handlers.map(asyncHandler));
            const name = handlers
                .map((fn) => fn.name?.replace(/^bound\s*/, "") || "anonymous")
                .join(", ");
            console.log(
                `  ${FgCyan}[${name}]${Reset} ${FgGreen}${method.toUpperCase()} ${FgRGB(255, 165, 0)}${resolveBaseURL("frontend") + path}`,
            );
        }
    }
}
