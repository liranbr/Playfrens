import { asyncHandler } from "./utils.js";

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
        const cyan = "\x1b[36m";
        const reset = "\x1b[0m";
        console.log(`Listening to ${cyan}${this.constructor.name}${reset}.`);
    }

    /**
     * Helper to register multiple routes in a DRY way
     * @param {Array<{ method: string, path: string, handler: Function }>} routes
     */
    registerRoutes(routes) {
        for (const { method, path, handler } of routes) {
            this.app[method](path, Service.asyncHandler(handler));
            const cyan = "\x1b[36m";
            const reset = "\x1b[0m";
            console.log(`\t* Binding ${cyan}${handler.name.replace(/^bound\s*/, "")}${reset}.`);
        }
    }

    static asyncHandler = asyncHandler;
}
