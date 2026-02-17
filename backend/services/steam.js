import SteamAPI from "steamapi";
import { Response } from "../response.js";
import { Service } from "../service.js";
import { includesAny, isImageUrlValid } from "../utils.js";

const DEBUG_GET_ITEMS_SAMPLE = false;
const DEFAULT_CHUNK_ARRAY_SIZE = 100;

export class SteamWebService extends Service {
    // Add as we discover more of them
    STEAM_GAMEPLAY_CATEGORIES = Object.freeze({
        MULTI_PLAYER: 1,
        SINGLE_PLAYER: 2,
        // SHARED_OR_SPLIT_SCREEN: 24, // idk, maybe?
    });

    /** TODO: IStoreBrowseService/GetItems for batched calling multiple Metadatas to get their perspective categories, basic info and assets
     * Example:
     * https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?key=<STEAM_WEBAPI_KEY>&input_json=%7B%22ids%22%3A%5B%7B%22appid%22%3A440%7D%2C%7B%22appid%22%3A570%7D%2C%7B%22appid%22%3A620%7D%5D%2C%22context%22%3A%7B%22language%22%3A%22english%22%2C%22country_code%22%3A%22US%22%7D%2C%22data_request%22%3A%7B%22include_assets%22%3Atrue%7D%7D
     */
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
                path: "/api/steam/getUserIDFromVanityName",
                handler: this.getUserIDFromVanityName.bind(this),
            },
            {
                method: "get",
                path: "/api/steam/getUserLibrary",
                handler: this.getUserLibrary.bind(this),
            },
            {
                method: "get",
                path: "/api/steam/getUserLibraryIDs",
                handler: this.getUserLibraryIDs.bind(this),
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
            {
                method: "get",
                path: "/api/steam/getWishlist",
                handler: this.getWishlist.bind(this),
            },
            {
                method: "get",
                path: "/api/steam/getWishListIDs",
                handler: this.getWishListIDs.bind(this),
            },
            {
                method: "post",
                path: "/api/steam/getItems",
                handler: this.getItems.bind(this),
            },
        ]);
    }

    async getUserIDFromVanityName(req, res) {
        /** @type {string} */
        const { vanity } = req.query;
        const { OK, BAD_REQUEST } = Response.HttpStatus;
        const isProfileURL = vanity.includes("https://steamcommunity.com/id/");
        if (!isProfileURL && /\W/.test(vanity)) {
            Response.sendMessage(res, BAD_REQUEST, "Vanity names do not have symbols!");
            return;
        }
        const client = this.connect();
        const id = await client.resolve(
            isProfileURL ? vanity : `https://steamcommunity.com/id/${vanity}`,
        );
        Response.send(res, OK, { id });
    }

    async getUserLibrary(req, res) {
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

    async getUserLibraryIDs(req, res) {
        const { id } = req.query;
        const { OK, BAD_REQUEST, NOT_FOUND } = Response.HttpStatus;

        if (!this.isSteamID(id))
            return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

        const client = this.connect();

        const games = await client.getUserOwnedGames(id);
        if (games.length === 0)
            return Response.sendMessage(
                res,
                NOT_FOUND,
                `Couldn't find any games using SteamID64 ${id}`,
            );
        const ids = games.map((g) => g.game.id);
        Response.send(res, OK, ids);
    }

    /**
     * Returns a list of a user's Steam friends (if their friends list is public)
     * @param {*} req
     * @param {*} res
     * @returns A list of Steam friends
     */
    async getFriends(req, res) {
        const { id } = req.query;
        const { OK, BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } = Response.HttpStatus;
        if (!this.isSteamID(id))
            return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

        const client = this.connect();

        // We need to catch 401 errors here since SteamAPI lib throws on them
        let response;
        try {
            response = await client.get("/ISteamUser/GetFriendList/v1", {
                steamid: id,
                relationship: "friend",
            });
        } catch (error) {
            if (error.statusCode === 401) {
                return Response.send(res, UNAUTHORIZED, {
                    error: "Account's friends list is private.",
                });
            }
            console.error("Error fetching friends list:", error);
            return Response.sendMessage(
                res,
                UNAUTHORIZED,
                `Couldn't get friends list for SteamID64 ${id}`,
            );
        }
        const friends = response.friendslist?.friends || [];

        if (friends.length === 0)
            return Response.sendMessage(
                res,
                NOT_FOUND,
                `Couldn't find any friends using SteamID64 ${id}`,
            );
        const friendSummaries = await this.getUserSummaries(friends.map((f) => f.steamid));

        Response.send(res, OK, friendSummaries);
    }
    /**
     * Returns a list of Steam game capsules for a user's owned games
     * @param {Object} req
     * @param {Object} res
     * @returns {{name: string, id: string, image: string}} An object containing the game name, ID, and image URL.
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
     * Returns App Items from Steam IStoreBrowseService/GetItems
     * https://steamapi.xpaw.me/#IStoreBrowseService/GetItems
     * @param {Object} req - The request object
     * @param {Object} res - The response object
     * @return {Object} - The response data from the Steam API
     */
    async getItems(req, res) {
        let { ids, categories, releasedOnly = false } = req.body;
        const { OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

        if (DEBUG_GET_ITEMS_SAMPLE)
            ids = [
                10, 20, 30, 40, 50, 70, 80, 90, 100, 130, 220, 240, 260, 280, 300, 320, 340, 360,
                380, 400, 420, 440, 480, 500, 550, 570, 620, 630, 730, 8930, 8940, 8980, 9000, 9050,
                9120, 9450, 9880, 9900, 9990, 10200, 10500, 10700, 10800, 10900, 11000, 11300,
                11400, 11500, 11700, 12100, 12200, 12300, 12500, 12700, 12900, 13100, 13200, 13500,
                13600, 13800, 14000, 14200, 14500, 14700, 14800, 15000, 15200, 15300, 15500, 15700,
                16000, 16200, 16300, 16500, 16700, 16900, 17000, 17200, 17400, 17500, 17700, 17800,
                18000, 18200, 18400,
            ];
        try {
            const data = await this.fetchItems(ids);
            console.log(
                `Filtering by categories: ${categories}${releasedOnly ? " and by released only." : ""}`,
            );
            let unreleasedGamesCount = 0;
            const result = data.filter((item) => {
                const playerCategories = item.categories?.supported_player_categoryids;
                // Some items are apparently privated
                if (!item.visible) return false;
                if (!Array.isArray(playerCategories)) return false;
                if(releasedOnly && item?.is_coming_soon === true) unreleasedGamesCount++;

                return (
                    includesAny(playerCategories, categories) &&
                    (!releasedOnly || item?.is_coming_soon !== true)
                );
            });
            console.log(`Sending ${result.length} items as final result.`);
            if(releasedOnly) console.log(`Of those filtered, ${unreleasedGamesCount} are unreleased.`)
            Response.send(res, OK, result);
        } catch (err) {
            console.error(err);
            Response.send(res, INTERNAL_SERVER_ERROR, {
                error: "Steam API request failed",
                message: err.message,
            });
        }
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
        const data = await this.fetchItems([appId]);
        const url = await this.buildGameCover(appId, data[0]?.assets?.library_capsule_2x ?? null);
        if (url) {
            const thumb = await this.buildGameCover(
                appId,
                data[0]?.assets?.library_capsule ?? null,
            );
            return Response.send(res, OK, { url: url, thumb: thumb });
        }
        return Response.send(res, NOT_FOUND, `No official Steam cover was found for id ${appId}`);
    }

    /**
     * Returns a list of IDs for a user's Wishlist
     * @param {Object} req
     * @param {Object} res
     */
    async getWishListIDs(req, res) {
        const { id } = req.query;
        const { OK, NO_CONTENT, BAD_REQUEST } = Response.HttpStatus;

        if (!this.isSteamID(id))
            return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

        const response = await fetch(
            `https://api.steampowered.com/IWishlistService/GetWishlist/v1?steamid=${id}`,
        );

        if (response.ok) {
            const json = await response.json();
            const data = await json?.response;
            if (data == undefined) Response.send(res, NO_CONTENT, { message: "FAILED" });
            else {
                const results = data.items.map((i) => i.appid);
                return Response.send(res, OK, results);
            }
        }
        return Response.send(res, BAD_REQUEST, await response.json());
    }

    /**
     * Returns a list of Items for a user's Wishlist
     * @param {Object} req
     * @param {Object} res
     * @deprecated Use {@link getWishListIDs} instead.
     */
    async getWishlist(_req, res) {
        const { GONE } = Response.HttpStatus;

        return Response.sendMessage(res, GONE, "Deprecated, use getWishListIDs entry instead.");
    }

    async buildGameCover(appId, imagePath = "") {
        const base = `https://shared.steamstatic.com/store_item_assets/steam/apps/${appId}/`;
        if (imagePath) return base + imagePath;
        const urlSuffixes = [
            "library_capsule_600x900_2x.jpg",
            "library_600x900_2x.jpg",
            "portrait.png",
        ];
        for (const suffix of urlSuffixes) {
            const url = base + suffix;
            if (await isImageUrlValid(url)) return url;
        }
        return "";
    }

    async getUserSummaries(ids) {
        const batches = this.chunkArray(ids, DEFAULT_CHUNK_ARRAY_SIZE);
        const results = [];
        const client = this.connect();
        for (const batch of batches) {
            const summaries = await client.getUserSummary(batch);
            results.push(...summaries);
        }
        console.log("Result:\n", results);
        return results;
    }

    /**
     * @param {string} id - string of numbers only
     * @returns {boolean} true if valid Steam ID
     */
    isSteamID(id) {
        return id.length === 17 && /^\d+$/.test(id);
    }

    chunkArray(array, chunkSize = 100) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    async fetchItems(ids) {
        const batches = this.chunkArray(ids, DEFAULT_CHUNK_ARRAY_SIZE);
        const results = [];
        for (const batch of batches) {
            const json = {
                context: {
                    language: "english",
                    country_code: "US",
                },
                data_request: {
                    include_assets: true,
                },
            };

            json.ids = batch.map((id) => {
                return { appid: id };
            });
            // Steam doesn't like body responses :(
            // So we have to send everything as URL params
            const params = new URLSearchParams({
                key: this.environment_key,
                // do NOT rename this key, if you value your life
                input_json: JSON.stringify(json),
            });
            const paramsStr = params.toString();
            const response = await fetch(
                `https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?${paramsStr}`,
            );
            const data = await response.json();
            results.push(...(await data.response.store_items));
        }
        console.log(`Sending ${results.length} items.`);
        return results;
    }
}
