import { Router } from "express";
import { Response } from "../response.js";

const router = Router();
const startTime = Date.now();

async function hello(_req, res) {
    const { OK } = Response.HttpStatus;
    Response.sendMessage(res, OK, "Hello from Playfrens! 🕹️");
}

async function status(_req, res) {
    const { OK } = Response.HttpStatus;
    const totalSeconds = Math.floor((Date.now() - startTime) / 1000);

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

    const startTimeFormatted = new Date(startTime).toISOString();

    Response.send(res, OK, {
        start_time: startTimeFormatted,
        uptime_seconds: totalSeconds,
        uptime: formatted,
    });
}

router.get("/", hello);
router.get("/status", status);

export default router;
