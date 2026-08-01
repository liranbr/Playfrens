import { enqueueRequest } from "@/services/RequestQueue.js";
import { HttpStatus, toastError } from "@/Utils";

export async function searchTitleOnStore(title, storeType, lang = "en", cc = "US") {
    if (!title || typeof title !== "string" || !title.trim()) return [];
    let fetchResponse;
    switch (storeType) {
        case "steam":
            fetchResponse = await fetch(
                `/api/steam/searchTitle?term=${title}&lang=${lang}&cc=${cc}`,
            );
            break;
        case "custom":
            fetchResponse = await fetch(`/api/steamgriddb/searchTitle?query=${title}`);
            break;
        default:
            toastError(`StoreType ${storeType} doesn't have a supported search.`);
            return;
    }
    const json = await fetchResponse.json();
    if (!fetchResponse.ok)
        return toastError("Game search request failed, please try again later", json);
    if (json.length === 0) return console.error(`No ${storeType} games were found using ${title}`);

    let results = [];
    switch (storeType) {
        case "steam":
            results = json?.items?.map((item) => ({
                id: item.id,
                name: item.name,
                title: item.name,
                storeType: "steam",
                storeID: item.id,
            }));
            break;
        case "custom":
            results = json?.map((item) => {
                return {
                    id: item.id,
                    name: sgdbDatedTitle(item), // name is what's displayed in SearchSelect results
                    title: item.name,
                    storeType: "custom",
                    sgdbID: item.id,
                    sgdbTitle: sgdbDatedTitle(item),
                };
            });
    }
    return results;
}

export async function getSteamIDFromVanity(vanity) {
    if (!vanity) throw Error(`Invalid Steam ID/Name passed "${vanity}".`);
    return await fetch(`/api/steam/getUserIDFromVanityName?vanity=${vanity}`);
}

export async function getSteamUserSummary(id) {
    if (!id) throw Error(`Invalid SteamID64 passed "${id}".`);
    return await fetch(`/api/steam/getUserSummary?id=${id}`);
}

export function sgdbDatedTitle(SGDBGame) {
    if (isNaN(SGDBGame.release_date)) return SGDBGame.name;
    const year = new Date(SGDBGame.release_date * 1000).getFullYear();
    return `${SGDBGame.name} (${year})`;
}

export async function getOfficialCoverImageURL(storeType, storeID) {
    if (!storeType || !storeID) return "";
    let fetchResponse;
    switch (storeType) {
        case "steam":
            fetchResponse = await fetch(`/api/steam/getGameCover?appId=${storeID}`);
            break;
        default:
            return console.error(
                `StoreType ${storeType} doesn't have a supported game cover fetcher.`,
            );
    }
    const json = await fetchResponse.json();
    if (!fetchResponse.ok) return console.error(json);
    return json;
}

/**
 * Batched version of getOfficialCoverImageURL, for refreshing many games' official covers at once.
 * @param {string} storeType
 * @param {string[]} storeIDs
 * @returns {Promise<{[storeID: string]: {url: string, thumb: string}}>} map of storeID -> cover, missing entries mean no official cover was found
 */
export async function getOfficialCoverImageURLs(storeType, storeIDs) {
    if (!storeType || !storeIDs?.length) return {};
    let fetchResponse;
    switch (storeType) {
        case "steam":
            fetchResponse = await fetch(`/api/steam/getGameCovers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appIds: storeIDs }),
            });
            break;
        default:
            return console.error(
                `StoreType ${storeType} doesn't have a supported batched game cover fetcher.`,
            );
    }
    const json = await fetchResponse.json();
    if (!fetchResponse.ok) return console.error(json);
    return json;
}

export async function getBoard() {
    try {
        const response = await fetch("/api/board", {
            method: "GET",
            credentials: "include",
        });

        if (response.status === HttpStatus.NO_CONTENT) {
            // No board found for this user
            return null;
        }

        if (!response.ok) {
            const error = await response.json();
            toastError("Error loading board, please try again later", error);
            return null;
        }

        const { board } = await response.json();
        return board;
    } catch (err) {
        toastError("Error loading board, please try again later", err);
        return null;
    }
}

// Replaces the entire Board
export function saveBoard(data) {
    return enqueueRequest(async () => {
        const json = JSON.stringify({ data });
        const response = await fetch("/api/board/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: json,
        });
        if (!response.ok) throw new Error(`Failed to save board (status ${response.status})`);
    });
}

// Updates parts of the Board
export function updateBoard(path, value) {
    return enqueueRequest(async () => {
        const json = JSON.stringify({ path: path, value: value });
        const response = await fetch("/api/board/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: json,
        });
        if (!response.ok) throw new Error(`Failed to update board (status ${response.status})`);
    });
}
