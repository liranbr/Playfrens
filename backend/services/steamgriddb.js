import { Response } from "../response.js";
import SGDB from "../../node_modules/steamgriddb/dist/index.js";
import { Service } from "../service.js";
import { isImageUrlValid } from "../utils.js";

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
        super.listen();
        this.app.get("/api/steamgriddb/getGrids", this.getGrids.bind(this));
        this.app.get("/api/steamgriddb/getGames", this.getGames.bind(this));
    }

    async getGrids(req, res) {
        const { query, steamID } = req.query;
        const { NOT_FOUND, INTERNAL_SERVER_ERROR, OK } = Response.HttpStatus;
        const client = this.connect();

        try {
            const game = await (async () => {
                if (steamID) return await client.getGameBySteamAppId(steamID);

                const games = await client.searchGame(query);
                if (games.length)
                    throw Response.sendMessage(
                        res,
                        NOT_FOUND,
                        `No games were found with the query: ${query}`,
                    );
                return games[0];
            })();
            const id = game.id ?? -1;

            if (id === -1)
                return Response.sendMessage(
                    res,
                    NOT_FOUND,
                    `ID-less game with the query: ${query}, cannot proceed.`,
                );

            const grids = await client.getGrids({ ...this.gridOptions, id });
            if (!grids.length)
                return Response.sendMessage(
                    res,
                    NOT_FOUND,
                    `No games were found with the query: ${query}`,
                );

            const result = grids.map((grid) => ({ url: grid.url, preview: grid.thumb }));
            // Steam only, fetch the original capsule art from Steam
            if (game.types.includes("steam") && steamID) {
                const getSteamAssetCapsule = async (appId) => {
                    const base = `https://shared.steamstatic.com/store_item_assets/steam/apps/${appId}/`;
                    const fileName = [
                        "library_capsule_600x900_2x.jpg",
                        "library_600x900_2x.jpg",
                        "portrait.png",
                    ];
                    for (const f of fileName) if (await isImageUrlValid(base + f)) return base + f;
                    return null;
                };
                const capsule = await getSteamAssetCapsule(steamID);
                result.unshift({ url: capsule, preview: capsule });
            }
            return Response.send(res, OK, result);
        } catch (error) {
            return Response.send(res, INTERNAL_SERVER_ERROR, error);
        }
    }

    async getGames(req, res) {
        const { query } = req.query;
        const { NOT_FOUND, INTERNAL_SERVER_ERROR, OK } = Response.HttpStatus;
        const client = this.connect();

        try {
            const games = await client.searchGame(query);
            if (games.length == 0)
                return Response.sendMessage(
                    res,
                    NOT_FOUND,
                    `No games were found with the query: ${query}`,
                );
            Response.send(res, OK, games);
        } catch (error) {
            return Response.send(res, INTERNAL_SERVER_ERROR, error);
        }
    }
}
