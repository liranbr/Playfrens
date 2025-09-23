import { Response } from "../response.js";
import { Service } from "../service.js";
import SteamAPI from "steamapi";
import { isImageUrlValid } from "../utils.js";

export class SteamWebService extends Service {
    constructor(app) {
        super(app, process.env.STEAM_WEB_API_KEY);
    }

    connect() {
        const client = new SteamAPI(this.environment_key);
        return client;
    }

    listen() {
        super.listen();
        this.registerRoutes([
            {
                method: "get",
                path: "/api/steam/getOwnedGames",
                handler: this.getOwnedGames.bind(this),
            },
            {
                method: "get",
                path: "/api/steam/getFriends",
                handler: this.getFriends.bind(this),
            },
            {
                method: "get",
                path: "/api/steam/getSteamCapsules",
                handler: this.getSteamCapsules.bind(this),
            },
            {
                method: "get",
                path: "/api/steam/searchTitle",
                handler: this.searchTitle.bind(this),
            },
            {
                method: "get",
                path: "/api/steam/getGameCover",
                handler: this.getGameCover.bind(this),
            },
        ]);
    }

    async getOwnedGames(req, res) {
        const { id } = req.query;
        const { OK, BAD_REQUEST, NOT_FOUND } = Response.HttpStatus;

        if (!this.isSteamID(id))
            return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

        const client = this.connect();

        const games = await client.getUserOwnedGames(id, { includeExtendedAppInfo: true });
        if (games.length === 0)
            return Response.sendMessage(
                res,
                NOT_FOUND,
                `Couldn't find any games using SteamID64 ${id}`,
            );
        Response.send(res, OK, games);
    }

    async getFriends(req, res) {
        const { id } = req.query;
        const { OK, BAD_REQUEST, NOT_FOUND } = Response.HttpStatus;
        if (!this.isSteamID(id))
            return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

        const client = this.connect();

        const friends = await client.getUserFriends(id);
        if (friends.length === 0)
            return Response.sendMessage(
                res,
                NOT_FOUND,
                `Couldn't find any friends using SteamID64 ${id}`,
            );
        Response.send(res, OK, friends);
    }
    /**
     *
     * @param {Object} req
     * @param {Object} res
     * @returns {{name: string, id: string, image: string}}  An object containing the game name, ID, and image URL.
     */

    async getSteamCapsules(req, res) {
        const { id } = req.query;
        const { OK, BAD_REQUEST } = Response.HttpStatus;

        if (!this.isSteamID(id))
            return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

        const client = this.connect();

        const games = await client.getUserOwnedGames(id, { includeExtendedAppInfo: true });

        const grids = games.map((game) => {
            const { id, capsuleFilename, name } = game.game;
            const gridImage = (() => {
                if (
                    capsuleFilename.includes("library_capsule.jpg") ||
                    capsuleFilename.includes("library_600x900.jpg")
                )
                    return capsuleFilename.replace(".jpg", "_2x.jpg");
                else return capsuleFilename;
            })();
            return {
                name: name,
                id: id,
                image: `https://shared.steamstatic.com/store_item_assets/steam/apps/${id}/${gridImage}`,
            };
        });
        Response.send(res, OK, grids);
    }
    /**
     * Search for games using Steam Storefront API, queries: term, lang, cc (country code)
     * @param {Object} req
     * @param {Object} res
     * @returns A list of games from Steam's storefront.
     */
    async searchTitle(req, res) {
        const { term, lang = "en", cc = "US" } = req.query;
        const { OK, NOT_FOUND } = Response.HttpStatus;
        const response = await fetch(
            `https://store.steampowered.com/api/storesearch/?term=${term}&l=${lang}&cc=${cc}`,
        );
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const data = await response.json();
        if (data.length === 0)
            return Response.send(res, NOT_FOUND, `No Steam games were found using "${term}"`);
        return Response.send(res, OK, data);
    }

    /** Returns an image capsule of a Steam game using a Steam App ID */
    async getGameCover(req, res) {
        const { appId } = req.query;
        const { OK, NOT_FOUND } = Response.HttpStatus;
        const base = `https://shared.steamstatic.com/store_item_assets/steam/apps/${appId}/`;
        const urlSuffixes = [
            "library_capsule_600x900_2x.jpg",
            "library_600x900_2x.jpg",
            "portrait.png",
        ];
        for (const suffix of urlSuffixes) {
            const url = base + suffix;
            if (await isImageUrlValid(url))
                return Response.send(res, OK, { url: url, preview: url });
        }
        return Response.send(res, NOT_FOUND, `No official Steam cover was found for id ${appId}`);
    }

    /**
     * @param {string} id - string of numbers only
     * @returns {boolean} true if valid Steam ID
     */
    isSteamID(id) {
        return id.length === 17 && /^\d+$/.test(id);
    }
}
