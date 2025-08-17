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
    listen() {
        console.log(`Listening to ${this.constructor.name}`);
    }

    /** @param {import('express').Response} res */
    sendOk = (res, data = {}) => {
        res.status(200).json(data);
    };

    /** @param {import('express').Response} res */
    sendNotFound = (res, resourceName, value) => {
        res.status(404).json({
            message: `Couldn't find any ${resourceName} matching ${value ? `name: ${value}` : "criteria"}`,
        });
    };
    /** @param {import('express').Response} res */
    sendError = (
        res,
        message = { message: "An error has occured while processing your request!" },
    ) => {
        res.status(500).json(message);
    };
}
