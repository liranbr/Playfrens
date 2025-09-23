import { Response } from "../response.js";
import SGDB from "../../node_modules/steamgriddb/dist/index.js";
import { Service } from "../service.js";

export class SteamGridDBService extends Service {
    constructor(app) {
        super(app, process.env.STEAMGRIDDB_API_KEY);
    }

    connect() {
        const client = new SGDB(this.environment_key);
        return client;
    }

    listen() {
        super.listen();
        this.registerRoutes([
            {
                method: "get",
                path: "/api/steamgriddb/getGrids",
                handler: this.getGrids.bind(this),
            },
            {
                method: "get",
                path: "/api/steamgriddb/getGameFromStore",
                handler: this.getGameFromStore.bind(this),
            },
            {
                method: "get",
                path: "/api/steamgriddb/searchTitle",
                handler: this.searchTitle.bind(this),
            },
        ]);
    }

    /** from a sgdbID, and optional nsfw param, returns sgdb grids{url, preview} */
    async getGrids(req, res) {
        const { sgdbID, nsfw = "false" } = req.query;
        const { NOT_FOUND, OK } = Response.HttpStatus;
        const client = this.connect();

        const gridOptions = {
            id: sgdbID,
            dimensions: ["600x900"],
            type: "game",
            nsfw: nsfw,
        };
        const grids = await client.getGrids(gridOptions);
        if (!grids.length)
            return Response.sendMessage(res, NOT_FOUND, `No grids were found for this game.`);
        const result = grids.map((grid) => ({ url: grid.url, preview: grid.thumb }));

        Response.send(res, OK, result);
    }

    /** from a storeType and storeID, returns SGDBGame */
    async getGameFromStore(req, res) {
        const { storeType, storeID } = req.query;
        const { NOT_FOUND, OK } = Response.HttpStatus;
        const client = this.connect();

        const game = await client.getGame({ type: storeType, id: storeID });
        if (!game)
            return Response.send(
                res,
                NOT_FOUND,
                `No SGDB game was found for the ${storeType} game with ID ${storeID}`,
            );

        Response.send(res, OK, game);
    }

    /** given a title, this searches for it on sgdb, returns SGDBGame[] results */
    async searchTitle(req, res) {
        const { query } = req.query;
        const { NOT_FOUND, OK } = Response.HttpStatus;
        const client = this.connect();

        const games = await client.searchGame(query);
        if (games.length === 0)
            return Response.sendMessage(
                res,
                NOT_FOUND,
                `No games were found with the query: ${query}`,
            );
        Response.send(res, OK, games);
    }
}
