import { asyncHandler, ConsoleColor } from "./utils.js";
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
        const { FgCyan, Reset } = ConsoleColor;
        console.log(`Listening to ${FgCyan}${this.constructor.name}${Reset}.`);
    }

    /**
     * Helper to register multiple routes in a DRY way
     * @param {Array<{ method: string, path: string, handler: Function }>} routes
     */
    registerRoutes(routes) {
        for (const { method, path, handler } of routes) {
            const handlers = Array.isArray(handler) ? handler : [handler];
            this.app[method](path, ...handlers);
            const {} = ConsoleColor;
            const { FgCyan, FgYellow, Reset } = ConsoleColor;
            const name = handlers.map((fn) => fn.name?.replace(/^bound\s*/, "") || "anonymous");
            console.log(`\t* Binding ${FgYellow}[${FgCyan}${name}${FgYellow}]${Reset}.`);
        }
    }

    static asyncHandler = asyncHandler;
}
