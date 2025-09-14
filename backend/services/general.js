import { Response } from "../response.js";
import { Service } from "../service.js";

export class GeneralService extends Service {
    constructor(app) {
        super(app); // no API key needed
        this.startTime = Date.now();
    }

    listen() {
        super.listen();
        this.registerRoutes([
            {
                method: "get",
                path: "/api/",
                handler: this.hello.bind(this),
            },
            {
                method: "get",
                path: "/api/status",
                handler: this.status.bind(this),
            },
        ]);
    }

    async hello(_, res) {
        const { OK } = Response.HttpStatus;
        Response.sendMessage(res, OK, "Hello from Playfrens! 🕹️");
    }

    async status(_, res) {
        const { OK } = Response.HttpStatus;
        const totalSeconds = Math.floor((Date.now() - this.startTime) / 1000);

        const days = Math.floor(totalSeconds / (24 * 3600));
        const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const formatted = [
            String(days).padStart(2, "0"),
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(seconds).padStart(2, "0"),
        ].join(":");

        const startDate = new Date(this.startTime);
        const startTimeFormatted = startDate.toISOString();

        Response.send(res, OK, {
            start_time: startTimeFormatted,
            uptime_seconds: totalSeconds,
            uptime: formatted,
        });
    }
}
