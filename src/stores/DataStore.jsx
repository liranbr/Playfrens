import { createContext, useContext } from "react";
import { action, autorun, makeAutoObservable, ObservableMap, reaction, runInAction } from "mobx";
import { compareGameTitlesAZ, compareTagNamesAZ, GameObject, TagObject, tagTypes } from "@/models";
import {
    loadFromStorage,
    saveToStorage,
    setToastSilence,
    toastError,
    toastSuccess,
} from "@/Utils.jsx";
import { globalSettingsStore, settingsStorageKey, useSettingsStore } from "@/stores";
import { version } from "/package.json";
import { compareTagFilteredGamesCount } from "@/models/TagObject.js";
import { SortingReaction } from "@/stores/SortingReaction.js";

const tT = tagTypes; // Short alias for convenience, used a lot here
const storageKeys = {
    [tT.friend]: "allFriends",
    [tT.category]: "allCategories",
    [tT.status]: "allStatuses",
    games: "allGames",
    settings: settingsStorageKey,
    version: "version",
    visited: "visited",
};

// #============#
// ‖ DATA STORE ‖
// #============#

/**
 * @class
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
            [tT.friend]: loadFromStorage(storageKeys[tT.friend], []),
            [tT.category]: loadFromStorage(storageKeys[tT.category], []),
            [tT.status]: loadFromStorage(storageKeys[tT.status], []),
        });
        this.populateGames(loadFromStorage(storageKeys.games, []));
        makeAutoObservable(this);

        // on any change to tags or games, save them
        autorun(() => saveToStorage(storageKeys[tT.friend], this.allTags[tT.friend]));
        autorun(() => saveToStorage(storageKeys[tT.category], this.allTags[tT.category]));
        autorun(() => saveToStorage(storageKeys[tT.status], this.allTags[tT.status]));
        autorun(() => saveToStorage(storageKeys.games, this.allGames));
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
                ...gameJson,
                tagIDs: {
                    [tT.friend]: getStoredTagIDsFromTagNames(tT.friend, gameJson.friends), // legacy fields
                    [tT.category]: getStoredTagIDsFromTagNames(tT.category, gameJson.categories),
                    [tT.status]: getStoredTagIDsFromTagNames(tT.status, gameJson.statuses),
                },
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
                        ...gameJson,
                        tagIDs: parseTagIDs(gameJson.tagIDs), // sets serialized as arrays - needs parsing
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

        this.allGames.forEach((game) => game.silentRemoveTag(tag));
        this.allTags[tag.type].delete(tag.id);
        return toastSuccess(`Removed ${tag.name} from ${tag.typeStrings.plural} list`);
    }

    editTag(tag, newName) {
        // Editing needs to be in the DataStore rather than the object itself, to prevent duplicate names
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        const storedTag = this.allTags[tag.type].get(tag.id);
        if (!storedTag)
            return toastError(`${tag.name} does not exist in ${tag.typeStrings.plural} list`);

        if (!newName || typeof newName !== "string" || !newName.trim())
            return toastError(`Cannot save a ${tag.typeStrings.single} without a name`);
        if (this.allTags[tag.type].values().some((t) => t.name === newName))
            return toastError(`${newName} already exists in ${tag.typeStrings.plural} list`);

        const oldName = tag.name;
        storedTag.name = newName;
        return toastSuccess(`Updated ${oldName} to ${newName} in ${tag.typeStrings.plural} list`);
    }

    updateAllTagFilteredGamesCounters(filteredGames) {
        for (const tagType in this.allTags) {
            this.allTags[tagType].forEach(
                (t) =>
                    (t.filteredGamesCount = filteredGames.filter((game) => game.hasTag(t)).length),
            );
        }
    }

    updateTagFilteredGamesCounter(tag, filteredGames) {
        // used whenever adding/removing a tag from a game. not the prettiest, but is efficient
        const t = this.allTags[tag.type].get(tag.id);
        t.filteredGamesCount = filteredGames.filter((game) => game.hasTag(t)).length;
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

    editGame(game, title, coverImageURL, sortingTitle) {
        // Editing needs to be in the DataStore rather than the object itself, to prevent duplicate names
        if (!(game instanceof GameObject)) return toastError("Invalid game object: " + game);
        const storedGame = this.allGames.get(game.id);
        if (!storedGame) return toastError(`${game.title} does not exist in the games list`);
        if (!title || typeof title !== "string" || !title.trim())
            return toastError("Cannot save a game without a title");
        if (game.title !== title && this.allGames.values().some((t) => t.title === title))
            return toastError(`${title} already exists in the games list`);
        if (!coverImageURL) return toastError("Cannot save a game without a cover image");

        storedGame.title = title;
        storedGame.coverImageURL = coverImageURL;
        storedGame.sortingTitle = sortingTitle;
        return toastSuccess(`Updated ${storedGame.title}`);
    }

    sortTagsByMethod(tagType, sortMethod, isDescending) {
        // console.log("Sorting Tags of type " + tagType + ", by method " + sortMethod.name);
        const entriesArray = [...this.allTags[tagType].entries()];
        entriesArray.sort(([id1, tag1], [id2, tag2]) => sortMethod(tag1, tag2));
        if (isDescending) entriesArray.reverse();

        // Needs to be runInAction because used by autorun/reaction, which seems to lose binding otherwise
        runInAction(() => this.allTags[tagType].replace(entriesArray));
    }

    sortGamesByMethod(sortMethod, isDescending) {
        // console.log("Sorting games, by method " + sortMethod.name);
        const entriesArray = [...this.allGames.entries()];
        entriesArray.sort(([id1, game1], [id2, game2]) => sortMethod(game1, game2));
        if (isDescending) entriesArray.reverse();

        // Needs to be runInAction because used by autorun/reaction, which seems to lose binding otherwise
        runInAction(() => this.allGames.replace(entriesArray));
    }
}

const dataStore = new DataStore();
// Prefer to use the context version in components, for expanded functionality in the future
// but the global version is available for non-component uses
const DataStoreContext = createContext(dataStore);
export const useDataStore = () => useContext(DataStoreContext);
export const globalDataStore = dataStore;

// #==============#
// ‖ AUTO-SORTING ‖
// #==============#

// These handle auto-sorting on relevant changes, e.g. If sorting friends by name, react when any friend's name changes
const sortingReactions = {
    [tT.friend]: null,
    [tT.category]: null,
    [tT.status]: null,
    games: null,
};

// And these set the sorting reactions, by reacting to changes in the SettingsStore.
// DataStore imports SettingsStore already, so this avoids circular imports.
const sortBySettingsReaction = (tagType) =>
    reaction(
        () => [
            globalSettingsStore.tagSortMethods[tagType],
            globalSettingsStore.tagSortDirection[tagType],
        ],
        (sortBy) => setTagSorting(tagType, sortBy[0], sortBy[1]),
    );
sortBySettingsReaction(tT.friend);
sortBySettingsReaction(tT.category);
sortBySettingsReaction(tT.status);

reaction(
    () => [globalSettingsStore.gameSortMethod, globalSettingsStore.gameSortDirection],
    (sortBy) => setGameSorting(sortBy[0], sortBy[1]),
);

function setTagSorting(tagType, sortSetting, sortDirection) {
    sortingReactions[tagType]?.disable();
    const isDescending = sortDirection === "desc";

    if (sortSetting === "custom") {
        // custom sort not implemented yet, so just does nothing
    } else if (sortSetting === "name") {
        sortingReactions[tagType] = new SortingReaction(
            () => [[...dataStore.allTags[tagType]].map(([id, tag]) => tag.name)],
            () => {
                dataStore.sortTagsByMethod(tagType, compareTagNamesAZ, isDescending);
            },
        );
    } else if (sortSetting === "count") {
        sortingReactions[tagType] = new SortingReaction(
            () => [[...dataStore.allTags[tagType]].map(([id, tag]) => tag.filteredGamesCount)],
            () => {
                dataStore.sortTagsByMethod(tagType, compareTagFilteredGamesCount, isDescending);
            },
        );
    }
    sortingReactions[tagType]?.enable();
}

function setGameSorting(sortSetting, sortDirection) {
    sortingReactions.games?.disable();
    const isDescending = sortDirection === "desc";

    if (sortSetting === "custom") {
        // custom sort not implemented yet, so just does nothing
    } else if (sortSetting === "title") {
        sortingReactions.games = new SortingReaction(
            () => [[...dataStore.allGames].map(([id, game]) => [game.title, game.sortingTitle])],
            () => {
                dataStore.sortGamesByMethod(compareGameTitlesAZ, isDescending);
            },
        );
    }
    sortingReactions.games?.enable();
}

// #=============#
// ‖ FILE BACKUP ‖
// #=============#

export function backupToFile() {
    console.log("Backing up data to file...");
    const data = {
        [storageKeys[tT.friend]]: dataStore.allTags[tT.friend], // turning maps into arrays to stringify
        [storageKeys[tT.category]]: dataStore.allTags[tT.category],
        [storageKeys[tT.status]]: dataStore.allTags[tT.status],
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
            [tT.friend]: data[storageKeys[tT.friend]],
            [tT.category]: data[storageKeys[tT.category]],
            [tT.status]: data[storageKeys[tT.status]],
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

// #==========================#
// ‖ FIRST VISIT DEFAULT TAGS ‖
// #==========================#
const firstVisit = loadFromStorage(storageKeys.visited, false) === false;
if (firstVisit && dataStore.allGames.size === 0) {
    dataStore.populateTagsFromTagNames({
        [tT.friend]: [],
        [tT.category]: ["Playthrough", "Round-based", "Persistent World"],
        [tT.status]: ["Playing", "LFG", "Paused", "Backlog", "Abandoned", "Finished"],
    });
}
saveToStorage(storageKeys.visited, true);
saveToStorage(storageKeys.version, version);
