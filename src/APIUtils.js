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
            return console.error(`StoreType ${storeType} doesn't have a supported search.`);
    }
    const json = await fetchResponse.json();
    if (!fetchResponse.ok) return console.error(json);
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
    return await fetch(`/api/steam/getUserIDFromVanityName?vanity=${vanity}`);
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

export async function getBoard() {
    try {
        const response = await fetch("/api/board", {
            method: "GET",
            credentials: "include",
        });

        if (response.status === 204) {
            // No board found for this user
            return null;
        }

        if (!response.ok) {
            const error = await response.json();
            console.error("Error fetching board:", error);
            return null;
        }

        const { board } = await response.json();
        return board;
    } catch (err) {
        console.error("Failed to fetch board:", err);
        return null;
    }
}

// Replaces the entire Board
export async function saveBoard(data) {
    try {
        const json = JSON.stringify({ data });
        await fetch("/api/board/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: json,
        });
    } catch (err) {
        console.error("Failed to save board:", err);
    }
}

// Updates parts of the Board
export async function updateBoard(path, value) {
    try {
        const json = JSON.stringify({ path: path, value: value });
        await fetch("/api/board/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: json,
        });
    } catch (err) {
        console.error("Failed to partial update board:", err);
    }
}
