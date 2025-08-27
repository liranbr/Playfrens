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
        console.log(`Listening to ${this.constructor.name}`);
    }
}
