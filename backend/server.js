import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { SteamGridDBService } from "./steamgriddb.js";

dotenv.config({ debug: true });

const app = express();
const PORT = 5174;

app.use(cors()); // allow frontend to call backend during dev

app.get("/api/hello", (_, res) => {
    res.status(200).send({ message: "Hello from Playfrens! 🕹️" });
});

app.listen(PORT, () => {
    console.log(`Listening to http://localhost:${PORT}`);
});

const services = [];

export const run = () => {
    console.log("run", process.env.STEAMGRIDDB_API_KEY);
    services.push(new SteamGridDBService(app));
};

run();
