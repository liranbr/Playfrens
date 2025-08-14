export class Service {
    environment_key = "";
    /** @type {import('express').Express} */
    app = null;
    /**
     * @param {import('express').Express} app
     */
    constructor(app, environment_key) {
        this.app = app;
        this.environment_key = environment_key;
        this.listen();
    }
    async connect() {}
    listen() {}
}
