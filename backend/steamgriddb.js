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

        try {
            const games = await client.searchGame(query);
            if (!games.length) return this.sendNotFound(res, "games", query);

            const id = games[0]?.id ?? -1;
            if (id === -1) return this.sendNotFound(res, "games", query);

            const grids = await client.getGrids({ ...this.gridOptions, id });
            if (!grids.length) return this.sendNotFound(res, "games", query);

            const images = grids.map((grid) => ({ url: grid.url, preview: grid.thumb }));
            return this.sendOk(res, images);
        } catch (error) {
            console.error(error);
            return this.sendError(res, { message: error });
        }
    }

    async getGames(req, res) {
        const { query } = req.params;
        const client = this.connect();
        const games = await client.searchGame(query);
        if (games.length == 0) return this.sendNotFound(res, "games", query);
        this.sendOk(res, games);
    }
}
