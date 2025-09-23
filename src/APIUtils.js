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
            return console.error(`StoreType ${storeType} is not supported in GenericStoreService`);
    }
    const json = await fetchResponse.json();
    if (!fetchResponse.ok) return console.error("Error: " + json);
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
            results = json?.map((item) => ({
                id: item.id,
                name: item.name,
                title: item.name,
                storeType: "custom",
                sgdbID: item.id,
                sgdbTitle: item.name,
            }));
    }
    return results;
}
