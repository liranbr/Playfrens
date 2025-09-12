import { Response } from "../response.js";
import { Service } from "../service.js";
import SteamAPI from "steamapi";

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
        this.app.get("/api/steamweb/getOwnedGames", this.getOwnedGames.bind(this));
        this.app.get("/api/steamweb/getFriends", this.getFriends.bind(this));
        this.app.get("/api/steamweb/getSteamCapsules", this.getSteamCapsules.bind(this));
        this.app.get("/api/steamweb/getStorefront", this.getGamesFromStorefront.bind(this));
    }

    async getOwnedGames(req, res) {
        const { id } = req.query;
        const { OK, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

        if (!this.isSteamID(id))
            return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

        const client = this.connect();

        try {
            const games = await client.getUserOwnedGames(id, { includeExtendedAppInfo: true });
            return games.length === 0
                ? Response.sendMessage(
                      res,
                      NOT_FOUND,
                      `Couldn't find any games using SteamID64 ${id}`,
                  )
                : Response.send(res, OK, games);
        } catch (error) {
            return Response.send(res, INTERNAL_SERVER_ERROR, error);
        }
    }

    async getFriends(req, res) {
        const { id } = req.query;
        const { OK, BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
        if (!this.isSteamID(id))
            return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

        const client = this.connect();

        try {
            const friends = await client.getUserFriends(id);
            return friends.length === 0
                ? Response.sendMessage(
                      res,
                      NOT_FOUND,
                      `Couldn't find any friends using SteamID64 ${id}`,
                  )
                : Response.send(res, OK, friends);
        } catch (error) {
            return Response.send(res, INTERNAL_SERVER_ERROR, error);
        }
    }
    /**
     *
     * @param {Object} req
     * @param {Object} res
     * @returns {{name: string, id: string, image: string}}  An object containing the game name, ID, and image URL.
     */

    async getSteamCapsules(req, res) {
        const { id } = req.query;
        const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

        if (!this.isSteamID(id))
            return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

        const client = this.connect();

        try {
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
            return Response.send(res, OK, grids);
        } catch (error) {
            return Response.send(res, INTERNAL_SERVER_ERROR, error);
        }
    }
    /**
     * Search for games using Steam Storefront API, queries: term, lang, cc (country code)
     * @param {Object} req
     * @param {Object} res
     * @returns A list of games from Steam's storefront.
     */
    async getGamesFromStorefront(req, res) {
        const { term, lang = "en", cc = "US" } = req.query;
        const { OK, NOT_FOUND, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
        const response = await fetch(
            `https://store.steampowered.com/api/storesearch/?term=${term}&l=${lang}&cc=${cc}`,
        );
        try {
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            const data = await response.json();
            if (data.length === 0)
                return Response.send(res, NOT_FOUND, `No games were found using "${query}"`);
            return Response.send(res, OK, data);
        } catch (error) {
            return Response.send(res, INTERNAL_SERVER_ERROR, error);
        }
    }

    /**
     * @param {string} id - string of numbers only
     * @returns {boolean} true if valid Steam ID
     */
    isSteamID(id) {
        return id.length === 17 && /^\d+$/.test(id);
    }
}
