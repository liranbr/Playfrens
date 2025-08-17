import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { SteamGridDBService } from "./steamgriddb.js";
import { SteamWebService } from "./steamweb.js";

const app = express();
const PORT = 5174;
const services = [];

dotenv.config({ debug: true });
app.use(cors()); // allow frontend to call backend during dev
app.get("/api/hello", (_, res) => {
    res.status(200).send({ message: "Hello from Playfrens! 🕹️" });
});

app.listen(PORT, () => {
    console.log(`Listening to http://localhost:${PORT}`);
});

export const main = () => {
    services.push(new SteamGridDBService(app));
    services.push(new SteamWebService(app));
};

main();
