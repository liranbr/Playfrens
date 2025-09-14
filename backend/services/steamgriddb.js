import { Response } from "../response.js";
import SGDB from "../../node_modules/steamgriddb/dist/index.js";
import { Service } from "../service.js";
import { isImageUrlValid } from "../utils.js";

export class SteamGridDBService extends Service {
    gridOptions = {
        type: "game",
        dimensions: ["600x900"],
    };

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
                path: "/api/steamgriddb/getGame",
                handler: this.getGame.bind(this),
            },
            {
                method: "get",
                path: "/api/steamgriddb/getGames",
                handler: this.getGames.bind(this),
            },
        ]);
    }

    async getGrids(req, res) {
        const { query, steamID, nsfw = false } = req.query;
        const { NOT_FOUND, OK } = Response.HttpStatus;
        const client = this.connect();

        const game = await this.findGame({ query, steamID }, client);
        if (!game)
            return Response.send(res, NOT_FOUND, `No games were found with the query: ${query}`);

        const id = game.id ?? -1;
        if (id === -1) return Response.sendMessage(res, NOT_FOUND, `ID-less game, cannot proceed.`);

        const grids = await client.getGrids({ ...this.gridOptions, id, nsfw });
        if (!grids.length)
            return Response.sendMessage(res, NOT_FOUND, `No grids were found for this game.`);

        const result = grids.map((grid) => ({ url: grid.url, preview: grid.thumb }));

        // Steam only, gets the capsule art
        if (game.types.includes("steam") && steamID) {
            const capsule = await this.getSteamAssetCapsule(steamID);
            if (capsule) result.unshift({ url: capsule, preview: capsule });
        }

        Response.send(res, OK, result);
    }

    async getGame(req, res) {
        const { query, steamID } = req.query;
        const { OK, NOT_FOUND } = Response.HttpStatus;

        const game = await this.findGame({ query, steamID });
        if (!game)
            return Response.send(res, NOT_FOUND, `No games were found with the query: ${query}`);

        Response.send(res, OK, game);
    }

    async getGames(req, res) {
        const { query } = req.query;
        const { NOT_FOUND, OK } = Response.HttpStatus;
        const client = this.connect();

        const games = await client.searchGame(query);
        if (games.length == 0)
            return Response.sendMessage(
                res,
                NOT_FOUND,
                `No games were found with the query: ${query}`,
            );
        Response.send(res, OK, games);
    }

    /**
     * #######
     * Helpers
     * #######
     */
    /**
     * Returns a game based on query or passed steamID.
     */
    async findGame({ query, steamID }, client = null) {
        !client && (client = this.connect());

        let game;

        if (steamID) {
            game = await client.getGameBySteamAppId(steamID);
        } else if (query) {
            const games = await client.searchGame(query);
            if (games.length === 0) return null;
            game = games[0];
        }
        return game;
    }

    /**
     * Returns an image capsule of a Steam game using a Steam App ID.
     */
    async getSteamAssetCapsule(appId) {
        const base = `https://shared.steamstatic.com/store_item_assets/steam/apps/${appId}/`;
        const urlSuffixes = [
            "library_capsule_600x900_2x.jpg",
            "library_600x900_2x.jpg",
            "portrait.png",
        ];
        for (const suffix of urlSuffixes) {
            const url = base + suffix;
            if (await isImageUrlValid(url)) return url;
        }
        return null;
    }
}
