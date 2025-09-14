import { asyncHandler, ConsoleColors, getBackendDomain, getFrontendDomain } from "./utils.js";
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
    constructor(app, environment_key) {
        this.app = app;
        this.environment_key = environment_key;
        this.listen();
    }
    async connect() {}
    listen() {
        const { FgYellow, Reset } = ConsoleColors;
        console.log(`${FgYellow}${this.constructor.name}${Reset} \\`);
    }

    /**
     * Helper to register multiple routes in a DRY way
     * @param {Array<{ method: string, path: string, handler: Function }>} routes
     */
    registerRoutes(routes) {
        const { FgCyan, FgGreen, Reset, FgRGB } = ConsoleColors;
        for (const { method, path, handler } of routes) {
            const handlers = Array.isArray(handler) ? handler : [handler];
            this.app[method](path, ...handlers);
            const name = handlers
                .map((fn) => fn.name?.replace(/^bound\s*/, "") || "anonymous")
                .join(", ");
            console.log(
                `  ${FgCyan}[${name}]${Reset} ${FgGreen}${method.toUpperCase()} ${FgRGB(255, 192, 203)}${getFrontendDomain()}${path}`,
            );
        }
    }

    static asyncHandler = asyncHandler;
}
