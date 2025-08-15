import { action, autorun, makeAutoObservable, observable } from "mobx";
import { compareGameTitlesAZ, compareTagNamesAZ, GameObject, TagObject, tagTypes } from "@/models";
import {
    loadFromStorage,
    saveToStorage,
    setToastSilence,
    toastError,
    toastSuccess,
} from "@/Utils.jsx";
import { settingsStorageKey } from "@/stores";
import { createContext, useContext } from "react";

const tT = tagTypes; // Shorter alias for convenience, used a lot here

export class DataStore {
    // TODO: Make allTags and allGames based on ID:Object Maps
    allTags = {
        [tT.friend.key]: observable.array(),
        [tT.category.key]: observable.array(),
        [tT.status.key]: observable.array(),
    };
    allGames = observable.array();

    constructor() {
        this.populateTags({
            [tT.friend.key]: loadFromStorage(tT.friend.storageKey, []),
            [tT.category.key]: loadFromStorage(tT.category.storageKey, []),
            [tT.status.key]: loadFromStorage(tT.status.storageKey, []),
        });
        this.populateGames(loadFromStorage("allGames", []));

        this.allTags[tT.friend.key].sort(compareTagNamesAZ);
        this.allGames.sort(compareGameTitlesAZ);

        makeAutoObservable(this);
    }

    /**
     * @param {{[key: string]: any[]}} tagStructure
     * handles arrays of TagObjects, TagObject jsons, or tagName strings, loading the resulting TagObjects into DataStore.allTags
     */
    populateTags(tagStructure) {
        for (const tagTypeKey in tagStructure) {
            const tagsList = tagStructure[tagTypeKey].filter(Boolean); // skip potential nulls, undefined, "" etc.
            let loadedTags = [];
            const allTagObjects = tagsList.every((tag) => tag instanceof TagObject);
            const allTagObjectJsons = tagsList.every((tag) => typeof tag === "object");
            const allTagNameStrings = tagsList.every((tag) => typeof tag === "string");

            if (allTagObjects) {
                loadedTags = tagsList;
            } else if (allTagObjectJsons) {
                loadedTags = tagsList.map((tag) => new TagObject(tag));
            } else if (allTagNameStrings) {
                loadedTags = tagsList.map((name) => new TagObject({ tagTypeKey, name }));
            }
            this.allTags[tagTypeKey].replace(loadedTags);
        }
    }

    populateGames(gameJsons) {
        const tagObjectsFromJsons = (tagTypeKey, gameTagJsons) => {
            const dataTags = this.allTags[tagTypeKey];
            // get the corresponding TagObjects from the DataStore for these (TagObject or tagName) jsons
            if (gameTagJsons.every((t) => typeof t === "object")) {
                return dataTags.filter((storedTag) =>
                    gameTagJsons.some((tagJson) => tagJson.id === storedTag.id),
                );
            } else if (gameTagJsons.every((tag) => typeof tag === "string")) {
                return dataTags.filter((storedTag) =>
                    gameTagJsons.some((tagName) => tagName === storedTag.name),
                );
            } else return [];
        };
        this.allGames.replace(
            gameJsons
                .filter((gameJson) => {
                    if (!gameJson) console.warn("Skipping invalid game data:", gameJson);
                    return !!gameJson;
                })
                .map(
                    (gameJson) =>
                        new GameObject({
                            title: gameJson.title,
                            coverImageURL: gameJson.coverImageURL,
                            sortingTitle: gameJson.sortingTitle,
                            friends: tagObjectsFromJsons(tT.friend.key, gameJson.friends),
                            categories: tagObjectsFromJsons(tT.category.key, gameJson.categories),
                            statuses: tagObjectsFromJsons(tT.status.key, gameJson.statuses),
                            note: gameJson.note,
                            id: gameJson.id,
                        }),
                ),
        );
    }

    addTag(tag) {
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        const fullList = this.allTags[tag.type.key];
        if (fullList.some((t) => t.equals(tag)))
            return toastError(`${tag.name} already exists in ${tag.type.plural} list`);

        fullList.push(tag);
        if (tag.type.key === tT.friend.key) fullList.sort(compareTagNamesAZ); // TODO: Temp, replace after implementing tag sorting options
        return toastSuccess(`Added ${tag.name} to ${tag.type.plural} list`);
    }

    removeTag(tag) {
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        if (!this.allTags[tag.type.key].includes(tag))
            return toastError(`${tag.name} does not exist in ${tag.type.plural} list`);

        setToastSilence(true); // TODO: Replace
        this.allGames.forEach((game) => game.removeTag(tag));
        this.allTags[tag.type.key].remove(tag);
        setToastSilence(false);
        return toastSuccess(`Removed ${tag.name} from ${tag.type.plural} list`);
    }

    editTag(tag, newName) {
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        if (!this.allTags[tag.type.key].includes(tag))
            return toastError(`${tag.name} does not exist in ${tag.type.plural} list`);
        if (!newName || typeof newName !== "string" || !newName.trim())
            return toastError(`Cannot save a ${tag.type.single} without a name`);

        const fullList = this.allTags[tag.type.key];
        const oldName = tag.name;
        fullList.find((t) => t.equals(tag)).name = newName;
        const oldValueIndex = fullList.indexOf(tag);
        if (!newName) return toastError(`Cannot save a ${tag.type.single} without a name`);
        if (oldValueIndex === -1)
            return toastError(`${tag.name} does not exist in ${tag.type.plural} list`);

        // if (tag.type.key === "friend") fullList.sort(compareAlphaIgnoreCase); // TODO: Temp, replace after implementing tag sorting options
        return toastSuccess(`Updated ${oldName} to ${newName} in ${tag.type.plural} list`);
    }

    addGame(title, coverImageURL, sortingTitle = "") {
        if (!title) {
            toastError("Cannot save a game without a title");
            return null;
        }
        if (this.allGames.some((game) => game.title === title)) {
            toastError(`${title} already exists in games list`);
            return null;
        }
        if (!coverImageURL) {
            toastError("Cannot save a game without a cover image");
            return null;
        }

        const newGame = new GameObject({
            title: title,
            coverImageURL: coverImageURL,
            sortingTitle: sortingTitle,
        });
        this.allGames.push(newGame);
        this.allGames.sort(compareGameTitlesAZ);
        toastSuccess("Added " + title + " to games list");
        return newGame;
    }

    removeGame(game) {
        const removed = this.allGames.remove(game);
        if (!removed) return toastError(`Failed to remove ${game.title} from games list`);
        return toastSuccess(`Removed ${game.title} from games list`);
    }
}

const dataStore = new DataStore();
// when a change is made to an array, it is saved to localstorage
autorun(() => saveToStorage(tT.friend.storageKey, dataStore.allTags[tT.friend.key]));
autorun(() => saveToStorage(tT.category.storageKey, dataStore.allTags[tT.category.key]));
autorun(() => saveToStorage(tT.status.storageKey, dataStore.allTags[tT.status.key]));
autorun(() => saveToStorage("allGames", dataStore.allGames));
// Prefer to use the context version in components, for expanded functionality in the future
// but the global version is available for non-component uses
const DataStoreContext = createContext(dataStore);
export const useDataStore = () => useContext(DataStoreContext);
export const globalDataStore = dataStore;

const firstVisit = loadFromStorage("Visited", false) === false;
if (firstVisit) {
    dataStore.populateTags({
        [tT.friend.key]: [],
        [tT.category.key]: ["Playthrough", "Round-based", "Persistent World"],
        [tT.status.key]: ["Playing", "LFG", "Paused", "Backlog", "Abandoned", "Finished"],
    });
    saveToStorage("Visited", true);
}

export const tagsSortOrder = {
    [tT.friend.key]: dataStore.allTags[tT.friend.key],
    [tT.category.key]: dataStore.allTags[tT.category.key],
    [tT.status.key]: dataStore.allTags[tT.status.key],
};

export function backupToFile() {
    console.log("Backing up data to file...");
    const data = {
        [tT.friend.storageKey]: dataStore.allTags[tT.friend.key],
        [tT.category.storageKey]: dataStore.allTags[tT.category.key],
        [tT.status.storageKey]: dataStore.allTags[tT.status.key],
        allGames: dataStore.allGames,
        settingsStorageKey: loadFromStorage(settingsStorageKey, {}),
    };
    const blob = new Blob([JSON.stringify(data, null, 4)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date().toISOString().split(".")[0].replace("T", " ").replaceAll(":", "-");
    a.href = url;
    a.download = `Playfrens ${timestamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

export function restoreFromFile(file) {
    console.log("Restoring data from file...");
    const reader = new FileReader();
    reader.onload = action(function (e) {
        const data = JSON.parse(e.target.result.toString());

        // Load and sort Tags and Games. They're localstorage-synced by the autoruns.
        dataStore.populateTags({
            [tT.friend.key]: data[tT.friend.storageKey],
            [tT.category.key]: data[tT.category.storageKey],
            [tT.status.key]: data[tT.status.storageKey],
        });
        dataStore.populateGames(data["allGames"]);

        dataStore.allGames.sort(compareGameTitlesAZ);
        dataStore.allTags[tT.friend.key].sort(compareTagNamesAZ);

        // Load the settings to localstorage, and reload, which also populates the SettingsStore
        saveToStorage(settingsStorageKey, data[settingsStorageKey]);
        window.location.reload();
    });
    reader.readAsText(file);
}
