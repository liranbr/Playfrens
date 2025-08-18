import { createContext, useContext } from "react";
import { action, autorun, makeAutoObservable, ObservableMap } from "mobx";
import { compareGameTitlesAZ, compareTagNamesAZ, GameObject, TagObject, tagTypes } from "@/models";
import {
    loadFromStorage,
    saveToStorage,
    setToastSilence,
    toastError,
    toastSuccess,
} from "@/Utils.jsx";
import { settingsStorageKey } from "@/stores";
import { version } from "/package.json";

// Shorter aliases for convenience, used a lot here
const storageKeys = {
    friend: "allFriends",
    category: "allCategories",
    status: "allStatuses",
    games: "allGames",
    settings: settingsStorageKey,
    version: "version",
    visited: "visited",
};
saveToStorage(storageKeys.version, version);
const tT = tagTypes;

// TODO: Known issue: sorting is down. implement sorting functions, that are then autorun on changes to tags/games/tag.names/game.titles

/**
 * @typedef {Object} DataStore
 * @property {{[key: string]: ObservableMap<String, TagObject>}} allTags
 * @property {ObservableMap<String, GameObject>} allGames
 */
export class DataStore {
    allTags = {
        [tT.friend]: new ObservableMap(),
        [tT.category]: new ObservableMap(),
        [tT.status]: new ObservableMap(),
    };
    allGames = new ObservableMap();

    constructor() {
        this.populateTags({
            [tT.friend]: loadFromStorage(storageKeys.friend, []),
            [tT.category]: loadFromStorage(storageKeys.category, []),
            [tT.status]: loadFromStorage(storageKeys.status, []),
        });
        this.populateGames(loadFromStorage(storageKeys.games, []));
        makeAutoObservable(this);
    }

    populateTagsFromTagNames(tagCollection) {
        for (const tagType in tagCollection) {
            this.allTags[tagType] = new ObservableMap(
                tagCollection[tagType]
                    .filter(Boolean) // skip potential nulls, undefined, "" etc.
                    .map((tagName) => new TagObject({ type: tagType, name: tagName }))
                    .map((tag) => [tag.id, tag]),
            );
        }
    }

    /**
     * @param {{[key: string]: any[]}} tagCollection - object holding, per tagType, an array of [id, TagObject] entries
     * Loads the resulting TagObjects into DataStore.allTags
     */
    populateTags(tagCollection) {
        for (const tagType in tagCollection) {
            this.allTags[tagType] = new ObservableMap(
                tagCollection[tagType]
                    .filter(Boolean)
                    .map(([id, tagJson]) => [id, new TagObject(tagJson)]),
            );
        }
    }

    // one-time compatibility load, makes GameObject jsons with tagName Arrays into GameObjects with TagID Sets
    populateGamesLegacy(gameJsons) {
        const getStoredTagIDsFromTagNames = (tagType, tagNames) => {
            return new Set(
                this.allTags[tagType]
                    .entries()
                    .filter(([_, storedTag]) => tagNames.includes(storedTag.name))
                    .map(([id, _]) => id),
            );
        };
        const gameObjects = gameJsons.filter(Boolean).map((gameJson) => {
            return new GameObject({
                title: gameJson.title,
                coverImageURL: gameJson.coverImageURL,
                sortingTitle: gameJson.sortingTitle,
                tagIDs: {
                    [tT.friend]: getStoredTagIDsFromTagNames(tT.friend, gameJson.friends), // legacy fields
                    [tT.category]: getStoredTagIDsFromTagNames(tT.category, gameJson.categories),
                    [tT.status]: getStoredTagIDsFromTagNames(tT.status, gameJson.statuses),
                },
                note: gameJson.note,
                id: gameJson.id,
            });
        });
        this.allGames = new ObservableMap(gameObjects.map((game) => [game.id, game]));
    }

    populateGames(gameJsons) {
        const parseTagIDs = (gameTagIDs) => {
            for (const tagType in gameTagIDs) {
                gameTagIDs[tagType] = new Set(gameTagIDs[tagType]);
            }
            return gameTagIDs;
        };
        this.allGames = new ObservableMap(
            gameJsons
                .filter(([id, gameJson]) => {
                    if (!id || !gameJson || !gameJson?.id) {
                        console.warn("Skipping invalid game. id: " + id + ", data:", gameJson);
                        return false;
                    }
                    return true;
                })
                .map(([id, gameJson]) => [
                    id, // the id of the [id, GameObject] entry in the map
                    new GameObject({
                        title: gameJson.title,
                        coverImageURL: gameJson.coverImageURL,
                        sortingTitle: gameJson.sortingTitle,
                        tagIDs: parseTagIDs(gameJson.tagIDs), // sets serialized as arrays - needs parsing
                        note: gameJson.note,
                        id: gameJson.id,
                    }),
                ]),
        );
    }

    getTagByID(id, tagType = null) {
        if (tagType) return this.allTags[tagType].get(id);
        // as there's only a few tagTypes, and Map.get is O(1), this remains O(1)
        for (const tagMap in Object.values(this.allTags)) {
            const tag = tagMap.get(id);
            if (tag) return tag;
        }
        return null;
    }

    addTag(tag) {
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        const fullList = this.allTags[tag.type];
        if ([...fullList.values()].some((t) => t.name === tag.name))
            return toastError(`${tag.name} already exists in ${tag.typeStrings.plural} list`);

        fullList.set(tag.id, tag);
        return toastSuccess(`Added ${tag.name} to ${tag.typeStrings.plural} list`);
    }

    removeTag(tag) {
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        if (!this.allTags[tag.type].has(tag.id))
            return toastError(`${tag.name} does not exist in ${tag.typeStrings.plural} list`);

        setToastSilence(true); // TODO: Replace with a silentRemove GameObject function
        this.allGames.forEach((game) => game.removeTag(tag));
        this.allTags[tag.type].delete(tag.id);
        setToastSilence(false);
        return toastSuccess(`Removed ${tag.name} from ${tag.typeStrings.plural} list`);
    }

    editTag(tag, newName) {
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        if (!newName || typeof newName !== "string" || !newName.trim())
            return toastError(`Cannot save a ${tag.typeStrings.single} without a name`);

        const storedTag = this.allTags[tag.type].get(tag.id);
        if (!storedTag)
            return toastError(`${tag.name} does not exist in ${tag.typeStrings.plural} list`);

        const oldName = tag.name;
        storedTag.name = newName;
        return toastSuccess(`Updated ${oldName} to ${newName} in ${tag.typeStrings.plural} list`);
    }

    addGame(title, coverImageURL, sortingTitle = "") {
        if (!title) {
            toastError("Cannot save a game without a title");
            return null;
        }
        if (this.allGames.values().some((game) => game.title === title)) {
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
        this.allGames.set(newGame.id, newGame);
        toastSuccess("Added " + title + " to games list");
        return newGame; // used to open the GamePage right after adding the game
    }

    removeGame(game) {
        const removed = this.allGames.delete(game.id);
        if (!removed) return toastError(`Failed to remove ${game.title} from games list`);
        return toastSuccess(`Removed ${game.title} from games list`);
    }
}

const dataStore = new DataStore();
// when a change is made to data, it is saved to localstorage
autorun(() => saveToStorage(storageKeys.friend, dataStore.allTags[tT.friend]));
autorun(() => saveToStorage(storageKeys.category, dataStore.allTags[tT.category]));
autorun(() => saveToStorage(storageKeys.status, dataStore.allTags[tT.status]));
autorun(() => saveToStorage(storageKeys.games, dataStore.allGames));
// Prefer to use the context version in components, for expanded functionality in the future
// but the global version is available for non-component uses
const DataStoreContext = createContext(dataStore);
export const useDataStore = () => useContext(DataStoreContext);
export const globalDataStore = dataStore;

const firstVisit = loadFromStorage(storageKeys.visited, false) === false;
if (firstVisit && dataStore.allGames.size === 0) {
    dataStore.populateTagsFromTagNames({
        [tT.friend]: [],
        [tT.category]: ["Playthrough", "Round-based", "Persistent World"],
        [tT.status]: ["Playing", "LFG", "Paused", "Backlog", "Abandoned", "Finished"],
    });
}
saveToStorage(storageKeys.visited, true);

export function backupToFile() {
    console.log("Backing up data to file...");
    const data = {
        [storageKeys.friend]: dataStore.allTags[tT.friend], // turning maps into arrays to stringify
        [storageKeys.category]: dataStore.allTags[tT.category],
        [storageKeys.status]: dataStore.allTags[tT.status],
        [storageKeys.games]: dataStore.allGames,
        [storageKeys.settings]: loadFromStorage(storageKeys.settings, {}),
        [storageKeys.version]: version,
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
        // Populate the DataStore's Tags and Games. They're then localstorage-synced by the autoruns.
        const tagCollection = {
            [tT.friend]: data[storageKeys.friend],
            [tT.category]: data[storageKeys.category],
            [tT.status]: data[storageKeys.status],
        };
        const legacyData = !data[storageKeys.version]; // Will remove, along with GamesLegacy, once testers update
        if (legacyData) {
            dataStore.populateTagsFromTagNames(tagCollection);
            dataStore.populateGamesLegacy(data[storageKeys.games]);
        } else {
            dataStore.populateTags(tagCollection);
            dataStore.populateGames(data[storageKeys.games]);
        }
        // Load the settings to localstorage, and reload, which also populates the SettingsStore
        saveToStorage(storageKeys.settings, data[storageKeys.settings]);
        window.location.reload();
    });
    reader.readAsText(file);
}
