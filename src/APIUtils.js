import { enqueueRequest } from "@/services/RequestQueue.js";
import { HttpStatus, toastError, toastInfo } from "@/Utils";

export async function searchTitleOnStore(title, storeType, includeMature = false) {
    if (!title || typeof title !== "string" || !title.trim()) return [];
    let fetchResponse;
    switch (storeType) {
        case "steam":
            fetchResponse = await fetch(
                `/api/steam/catalog/search?term=${title}&excludeDlc=true&includeMature=${includeMature}`,
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
    if (fetchResponse.status === HttpStatus.NOT_FOUND) {
        toastInfo(`No results found for "${title}"`);
        return [];
    }
    if (!fetchResponse.ok)
        return toastError("Game search request failed, please try again later", json);
    if (json.length === 0) return console.error(`No ${storeType} games were found using ${title}`);

    let results = [];
    switch (storeType) {
        case "steam":
            results = json?.map((item) => ({
                id: item.appid,
                name: item.name,
                title: item.name,
                storeType: "steam",
                storeID: item.appid,
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

// Lists boards the current user can access (their own + any they've joined as a guest).
export async function listBoards() {
    try {
        const response = await fetch("/api/boards", { credentials: "include" });
        // Not logged in is a normal state (e.g. stale session), not an error, so don't toast for
        // it. UserStore already guards against this; this is just a backstop for other callers.
        if (response.status === HttpStatus.UNAUTHORIZED) return [];
        if (!response.ok) {
            toastError("Error loading boards, please try again later", await response.json());
            return [];
        }
        const { boards } = await response.json();
        return boards;
    } catch (err) {
        toastError("Error loading boards, please try again later", err);
        return [];
    }
}

/** Creates an additional owned board (capped server-side). Returns { id, shortId, name, role }. */
export async function createBoard(name) {
    const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok)
        throw new Error(json.error || `Failed to create board (status ${response.status})`);
    return json.board;
}

export async function getBoard(boardId) {
    try {
        const response = await fetch(`/api/boards/${boardId}`, {
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
export function saveBoard(boardId, data) {
    return enqueueRequest(async () => {
        const json = JSON.stringify({ data });
        const response = await fetch(`/api/boards/${boardId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: json,
        });
        if (!response.ok) throw new Error(`Failed to save board (status ${response.status})`);
        return await response.json(); // { message, lastUpdated }
    });
}

// Updates part of the Board
export function updateBoard(boardId, path, value, getExpectedLastUpdated) {
    return enqueueRequest(async () => {
        const expectedLastUpdated =
            typeof getExpectedLastUpdated === "function"
                ? getExpectedLastUpdated()
                : getExpectedLastUpdated;
        const body = { path, value };
        if (expectedLastUpdated) body.expectedLastUpdated = expectedLastUpdated;

        const response = await fetch(`/api/boards/${boardId}/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(body),
        });
        const json = await response.json().catch(() => ({}));

        if (response.status === HttpStatus.CONFLICT) {
            const error = new Error(json.error || "Board changed since your last sync.");
            error.staleWrite = true;
            throw error;
        }
        if (!response.ok) throw new Error(`Failed to update board (status ${response.status})`);
        return json; // { message, lastUpdated }
    });
}

export async function renameBoard(boardId, name) {
    const response = await fetch(`/api/boards/${boardId}/rename`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok)
        throw new Error(json.error || `Failed to rename board (status ${response.status})`);
    return json.name;
}

export async function deleteBoard(boardId) {
    const response = await fetch(`/api/boards/${boardId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!response.ok) throw new Error(`Failed to delete board (status ${response.status})`);
}

export async function listBoardGuests(boardId) {
    const response = await fetch(`/api/boards/${boardId}/guests`, { credentials: "include" });
    if (!response.ok) throw new Error(`Failed to load guests (status ${response.status})`);
    const { guests } = await response.json();
    return guests;
}

/** Returns { guest, password }, where the password is shown only once here. */
export async function createBoardGuest(boardId, username, password) {
    const response = await fetch(`/api/boards/${boardId}/guests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok)
        throw new Error(json.error || `Failed to create guest (status ${response.status})`);
    return json;
}

export async function removeBoardGuest(boardId, userId) {
    const response = await fetch(`/api/boards/${boardId}/guests/${userId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.error || `Failed to remove guest (status ${response.status})`);
    }
}
