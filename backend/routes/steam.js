import "../env.js";
import { Router } from "express";
import SteamAPI from "steamapi";
import { Response } from "../response.js";
import { includesAny, isImageUrlValid } from "../utils.js";

const DEBUG_GET_ITEMS_SAMPLE = false;
const DEFAULT_CHUNK_ARRAY_SIZE = 100;

const client = new SteamAPI(process.env.STEAM_WEB_API_KEY);

/**
 * @param {string} id - string of numbers only
 * @returns {boolean} true if valid Steam ID
 */
function isSteamID(id) {
    return id.length === 17 && /^\d+$/.test(id);
}

function chunkArray(array, chunkSize = 100) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

/**
 * Fetches App metadata of multiple IDs.
 * @todo IStoreBrowseService/GetItems for batched calling multiple Metadatas to get their perspective categories, basic info and assets
 * @example "https://api.steampowered.com/IStoreBrowseService/GetItems/v1/?key=<STEAM_WEBAPI_KEY>&input_json=%7B%22ids%22%3A%5B%7B%22appid%22%3A440%7D%2C%7B%22appid%22%3A570%7D%2C%7B%22appid%22%3A620%7D%5D%2C%22context%22%3A%7B%22language%22%3A%22english%22%2C%22country_code%22%3A%22US%22%7D%2C%22data_request%22%3A%7B%22include_assets%22%3Atrue%7D%7D"
 *
 */
async function fetchItems(ids) {
    const batches = chunkArray(ids, DEFAULT_CHUNK_ARRAY_SIZE);
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
            key: process.env.STEAM_WEB_API_KEY,
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

async function buildGameCover(appId, imagePath = "") {
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

async function getUserSummaries(ids) {
    const batches = chunkArray(ids, DEFAULT_CHUNK_ARRAY_SIZE);
    const results = [];
    for (const batch of batches) {
        const summaries = await client.getUserSummary(batch);
        results.push(...summaries);
    }
    console.log("Result:\n", results);
    return results;
}

/** Returns a Steam user's public profile summary like nickname, avatar and profile URL. */
async function getUserSummary(req, res) {
    const { id } = req.query;
    const { OK, BAD_REQUEST, NOT_FOUND } = Response.HttpStatus;

    if (!isSteamID(id))
        return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

    try {
        const summary = await client.getUserSummary(id);
        Response.send(res, OK, summary);
    } catch {
        Response.sendMessage(res, NOT_FOUND, `Couldn't find Steam profile for SteamID64 ${id}`);
    }
}

async function getUserIDFromVanityName(req, res) {
    /** @type {string} */
    const { vanity } = req.query;
    const { OK, NOT_FOUND, BAD_REQUEST } = Response.HttpStatus;
    const vanityCleaned = vanity.trim();
    const isProfileURL =
        vanityCleaned.startsWith("http://steamcommunity.com/id/") ||
        vanityCleaned.startsWith("https://steamcommunity.com/id/") ||
        vanityCleaned.startsWith("http://steamcommunity.com/profiles/") ||
        vanityCleaned.startsWith("https://steamcommunity.com/profiles/");
    if (!isProfileURL && !/^[A-Za-z0-9_-]+$/.test(vanity)) {
        Response.sendMessage(
            res,
            BAD_REQUEST,
            "Steam Custom URLs can only have alphanumeric, underscore, or hyphen characters!",
        );
        return;
    }
    try {
        const id = await client.resolve(
            isProfileURL ? vanityCleaned : `https://steamcommunity.com/id/${vanityCleaned}`,
        );
        Response.send(res, OK, { id });
    } catch (e) {
        if (e.message === "No match") {
            Response.sendMessage(res, NOT_FOUND, "Steam user not found.");
        } else Response.sendMessage(res, BAD_REQUEST, e.message);
    }
}

async function getUserLibrary(req, res) {
    const { id } = req.query;
    const { OK, BAD_REQUEST, NOT_FOUND } = Response.HttpStatus;

    if (!isSteamID(id))
        return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

    const games = await client.getUserOwnedGames(id, { includeExtendedAppInfo: true });
    if (games.length === 0)
        return Response.sendMessage(
            res,
            NOT_FOUND,
            `Couldn't find any games using SteamID64 ${id}`,
        );
    Response.send(res, OK, games);
}

async function getUserLibraryIDs(req, res) {
    const { id } = req.query;
    const { OK, BAD_REQUEST, NOT_FOUND, NO_CONTENT } = Response.HttpStatus;

    if (!isSteamID(id))
        return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

    try {
        const games = await client.getUserOwnedGames(id);
        if (games.length === 0) return Response.send(res, NO_CONTENT, games);
        const ids = games.map((g) => g.game.id);
        return Response.send(res, OK, ids);
    } catch (err) {
        return Response.sendMessage(
            res,
            NOT_FOUND,
            `Couldn't find any games using SteamID64 ${id} | ${err}`,
        );
    }
}

/**
 * Returns a list of a user's Steam friends (if their friends list is public)
 */
async function getFriends(req, res) {
    const { id } = req.query;
    const { OK, BAD_REQUEST, NOT_FOUND, UNAUTHORIZED } = Response.HttpStatus;
    if (!isSteamID(id))
        return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

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
    const friendSummaries = await getUserSummaries(friends.map((f) => f.steamid));

    Response.send(res, OK, friendSummaries);
}

/**
 * Returns a list of Steam game capsules for a user's owned games
 */
async function getSteamCapsules(req, res) {
    const { id } = req.query;
    const { OK, BAD_REQUEST } = Response.HttpStatus;

    if (!isSteamID(id))
        return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

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
 */
async function getItems(req, res) {
    /** @type {{ids?: number[], groupedIDs?: Object.<string, number[]>, categories?: number[], releasedOnly?: boolean}} */
    let { ids, groupedIDs, categories, releasedOnly = false } = req.body;
    const { OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

    if (DEBUG_GET_ITEMS_SAMPLE)
        ids = [
            10, 20, 30, 40, 50, 70, 80, 90, 100, 130, 220, 240, 260, 280, 300, 320, 340, 360, 380,
            400, 420, 440, 480, 500, 550, 570, 620, 630, 730, 8930, 8940, 8980, 9000, 9050, 9120,
            9450, 9880, 9900, 9990, 10200, 10500, 10700, 10800, 10900, 11000, 11300, 11400, 11500,
            11700, 12100, 12200, 12300, 12500, 12700, 12900, 13100, 13200, 13500, 13600, 13800,
            14000, 14200, 14500, 14700, 14800, 15000, 15200, 15300, 15500, 15700, 16000, 16200,
            16300, 16500, 16700, 16900, 17000, 17200, 17400, 17500, 17700, 17800, 18000, 18200,
            18400,
        ];

    /**
     * @param {number[]} items
     * @param {string} groupName
     * @returns {number[]}
     */
    const filterItems = (items, groupName = "") => {
        const result = items.filter((item) => {
            const playerCategories = item.categories?.supported_player_categoryids;
            // Some items are apparently privated
            if (!item.visible) return false;
            if (!Array.isArray(playerCategories)) return false;
            return (
                includesAny(playerCategories, categories) &&
                (groupName !== "wishlist" || !releasedOnly || item?.is_coming_soon !== true)
            );
        });
        return result;
    };

    try {
        const data = [];
        // Overrides ids
        if (groupedIDs) {
            for (const groupName in groupedIDs) {
                const groupData = await fetchItems(groupedIDs[groupName]);
                const result = filterItems(groupData, groupName);
                data.push(...result);
            }
        } else {
            const itemsData = await fetchItems(ids);
            const result = filterItems(itemsData);
            data.push(result);
        }
        Response.send(res, OK, data);
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
 */
async function searchTitle(req, res) {
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
async function getGameCover(req, res) {
    const { appId } = req.query;
    const { OK, NOT_FOUND } = Response.HttpStatus;
    const data = await fetchItems([appId]);
    const url = await buildGameCover(appId, data[0]?.assets?.library_capsule_2x ?? null);
    if (url) {
        const thumb = await buildGameCover(appId, data[0]?.assets?.library_capsule ?? null);
        return Response.send(res, OK, { url: url, thumb: thumb });
    }
    return Response.send(res, NOT_FOUND, `No official Steam cover was found for id ${appId}`);
}

/**
 * Returns image capsules for multiple Steam games given an array of App IDs.
 * Returns a map of appId -> {url, thumb}; appIds with no official cover found are omitted.
 */
async function getGameCovers(req, res) {
    const { appIds } = req.body;
    const { OK, BAD_REQUEST } = Response.HttpStatus;

    if (!Array.isArray(appIds) || appIds.length === 0)
        return Response.sendMessage(res, BAD_REQUEST, "appIds must be a non-empty array");

    const items = await fetchItems(appIds);
    const itemsByAppId = new Map(items.map((item) => [String(item.appid), item]));

    const covers = {};
    for (const appId of appIds) {
        const item = itemsByAppId.get(String(appId));
        const url = await buildGameCover(appId, item?.assets?.library_capsule_2x ?? null);
        if (!url) continue;
        const thumb = await buildGameCover(appId, item?.assets?.library_capsule ?? null);
        covers[appId] = { url, thumb };
    }
    return Response.send(res, OK, covers);
}

/**
 * Returns a list of IDs for a user's Wishlist
 */
async function getWishListIDs(req, res) {
    const { id } = req.query;
    const { OK, NO_CONTENT, BAD_REQUEST } = Response.HttpStatus;

    if (!isSteamID(id))
        return Response.sendMessage(res, BAD_REQUEST, `Invalid SteamID64 passed: ${id}`);

    const response = await fetch(
        `https://api.steampowered.com/IWishlistService/GetWishlist/v1?steamid=${id}`,
    );

    if (response.ok) {
        const json = await response.json();
        const data = await json?.response;
        if (data === undefined || Object.keys(data).length === 0)
            return Response.send(res, NO_CONTENT, []); // Steam doesn't differentiate between Empty vs Unauthorized, seems to return an empty map either way
        else {
            const results = data.items.map((i) => i.appid);
            return Response.send(res, OK, results);
        }
    }
    const result = await response.json();
    return Response.send(res, BAD_REQUEST, result);
}

/**
 * Returns a list of Items for a user's Wishlist
 * @deprecated Use getWishListIDs instead.
 */
// eslint-disable-next-line no-unused-vars
async function getWishlist(_req, res) {
    const { GONE } = Response.HttpStatus;

    return Response.sendMessage(res, GONE, "Deprecated, use getWishListIDs entry instead.");
}

const router = Router();
router.get("/getUserIDFromVanityName", getUserIDFromVanityName);
router.get("/getUserSummary", getUserSummary);
router.get("/getUserLibrary", getUserLibrary);
router.get("/getUserLibraryIDs", getUserLibraryIDs);
router.get("/getFriends", getFriends);
router.get("/getSteamCapsules", getSteamCapsules);
router.get("/searchTitle", searchTitle);
router.get("/getGameCover", getGameCover);
router.post("/getGameCovers", getGameCovers);
// router.get("/getWishlist", getWishlist);
router.get("/getWishListIDs", getWishListIDs);
router.post("/getItems", getItems);

export default router;

