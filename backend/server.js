import dotenv from "dotenv";
import { SteamGridDBService } from "./steamgriddb.js";

import express from "express";
import cors from "cors";

const app = express();
const PORT = 5174;

app.use(cors()); // allow frontend to call backend during dev

app.get("/api/hello", (req, res) => {
    res.json({ message: "Hello from backend!" });
});
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});

const services = [];

dotenv.config({ debug: true });

export const run = () => {
    console.log("run", process.env.STEAMGRIDDB_API_KEY);
    new SteamGridDBService();
};
