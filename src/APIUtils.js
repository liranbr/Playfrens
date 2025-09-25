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

export function sgdbDatedTitle(SGDBGame) {
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
