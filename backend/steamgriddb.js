import SGDB from "../node_modules/steamgriddb/dist/index.js";
import { Service } from "./service.js";

export class SteamGridDBService extends Service {
    gridOptions = {
        type: "game",
        dimensions: ["600x900"],
        nsfw: false,
    };

    constructor(app) {
        super(app, process.env.STEAMGRIDDB_API_KEY);
    }

    connect() {
        const client = new SGDB(this.environment_key);
        return client;
    }

    listen() {
        this.app.get("/api/steamgriddb/getGrids/:query", this.getGrids.bind(this));
        this.app.get("/api/steamgriddb/getGames/:query", this.getGames.bind(this));
    }

    async getGrids(req, res) {
        const { query } = req.params;
        const client = this.connect();
        const games = await client.searchGame(query);
        if (games.length == 0) return this.sendNotFound(res, "games", query);
        const id = games[0]?.id ?? -1;
        if (id == -1) return this.sendNotFound(res, "games", query);
        client
            .getGrids({ ...this.gridOptions, id: id })
            .then((grids) => {
                if (grids.length == 0) return this.sendNotFound(res, "games", query);
                else {
                    const images = grids.map((grid) => {
                        return { url: grid.url, preview: grid.thumb };
                    });
                    this.sendOk(res, images);
                }
            })
            .catch((error) => {
                console.error(error);
                res.status(500).json({ status: 500, message: error });
            });
    }

    async getGames(req, res) {
        const { query } = req.params;
        const client = this.connect();
        const games = await client.searchGame(query);
        if (games.length == 0) {
            this.sendNotFound(res, "games", query);
            return;
        }
        this.sendOk(res, games);
    }
}
