import SGDB from "../node_modules/steamgriddb/dist/index.js";
import { Service } from "./service.js";

export class SteamGridDBService extends Service {
    constructor(app) {
        super(app, process.env.STEAMGRIDDB_API_KEY);
    }
    connect() {
        const client = new SGDB(this.environment_key);
        return client;
    }

    listen() {
        this.app.get("/api/steamgriddb/getGrid/:name", async (req, res) => {
            const response_noResults = () => {
                res.status(404).json({
                    status: 404,
                    message: "Couldn't find any games matching name: " + name,
                });
            };
            const name = req.params.name;
            const client = this.connect();
            const games = await client.searchGame("" + name);
            if (games.length == 0) {
                return response_noResults();
            }
            const id = games[0]?.id ?? -1;
            if (id == -1) {
                return response_noResults();
            }
            client
                .getGrids({ type: "game", id: id, dimensions: ["600x900"], nsfw: false })
                .then((grids) => {
                    res.status(200).json(grids);
                })
                .catch((error) => {
                    console.error(error);
                });
        });
    }
}
