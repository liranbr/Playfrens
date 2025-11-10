import { createContext, useContext } from "react";
import {
    action,
    autorun,
    computed,
    makeAutoObservable,
    ObservableMap,
    reaction,
    runInAction,
} from "mobx";

import {
    compareGameTitlesAZ,
    compareTagFilteredGamesCount,
    compareTagNamesAZ,
    compareTagTotalGamesCount,
    GameObject,
    ReminderObject,
    storeTypes,
    TagObject,
    tagTypes,
} from "@/models";
import { globalSettingsStore, settingsStorageKey } from "@/stores";
import { SortingReaction } from "./SortingReaction.js";
import {
    deleteItemFromArray,
    ensureUniqueName,
    loadFromStorage,
    moveItemInArray,
    saveToStorage,
    toastError,
    toastSuccess,
} from "@/Utils.jsx";
import { version } from "/package.json";
import { Party } from "@/models/GameObject.js";

const tT = tagTypes; // Short alias for convenience, used a lot here
export const defaultFiltersStorageKey = "defaultFilters";
const storageKeys = {
    [tT.friend]: "allFriends",
    [tT.category]: "allCategories",
    [tT.status]: "allStatuses",
    games: "allGames",
    reminders: "allReminders",
    settings: settingsStorageKey,
    defaultFilters: defaultFiltersStorageKey,
    version: "version",
    visited: "visited",
    tagsCustomOrders: "tagsCustomOrders",
};

// #============#
// ‖ DATA STORE ‖
// #============#

/**
 * @class
 * @property {{[key: string]: ObservableMap<String, TagObject>}} allTags
 * @property {ObservableMap<String, GameObject>} allGames
 * @property {{[key: string]: String[]}} tagsCustomOrders
 * @property {ReminderObject[]} allReminders
 */
export class DataStore {
    showTour = false;
    allTags = {
        [tT.friend]: new ObservableMap(),
        [tT.category]: new ObservableMap(),
        [tT.status]: new ObservableMap(),
    };
    allGames = new ObservableMap();
    // Custom Orders are saved as an array of Tag IDs, initialized from their current order when Custom Sort is first chosen
    tagsCustomOrders = {
        [tT.friend]: [],
        [tT.category]: [],
        [tT.status]: [],
    };
    allReminders = [];

    constructor() {
        this.populateTags({
            [tT.friend]: loadFromStorage(storageKeys[tT.friend], []),
            [tT.category]: loadFromStorage(storageKeys[tT.category], []),
            [tT.status]: loadFromStorage(storageKeys[tT.status], []),
        });
        this.populateGames(
            loadFromStorage(storageKeys.games, []),
            loadFromStorage(storageKeys.version, ""),
        );
        this.populateReminders(loadFromStorage(storageKeys.reminders, []));
        this.populateTagsCustomOrders(loadFromStorage(storageKeys.tagsCustomOrders, {}));
        makeAutoObservable(this, { sortedReminders: computed });

        // on any change to tags or games, save them
        autorun(() => saveToStorage(storageKeys[tT.friend], this.allTags[tT.friend]));
        autorun(() => saveToStorage(storageKeys[tT.category], this.allTags[tT.category]));
        autorun(() => saveToStorage(storageKeys[tT.status], this.allTags[tT.status]));
        autorun(() => saveToStorage(storageKeys.games, this.allGames));
        autorun(() => saveToStorage(storageKeys.reminders, this.allReminders));
        autorun(() => saveToStorage(storageKeys.tagsCustomOrders, this.tagsCustomOrders));

        // when any game is added/removed, update the totalGamesCounter in every tag
        reaction(
            () => this.allGames.keys(),
            () => this.updateAllTagTotalGamesCounters(),
            { fireImmediately: true },
        );
    }

    // Used when loading some predefined set, like the starting defaults
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

    /** @param {{[key: string]: any[]}} tagCollection - object holding, per tagType, an array of [id, serialized TagObject] entries */
    populateTags(tagCollection) {
        for (const tagType in tagCollection) {
            this.allTags[tagType] = new ObservableMap(
                tagCollection[tagType]
                    .filter(Boolean)
                    .map(([id, tagJson]) => [id, new TagObject(tagJson)]),
            );
        }
    }

    deserializeGameTagIDs(gameTagIDs) {
        for (const tagType in gameTagIDs) {
            gameTagIDs[tagType] = new Set(gameTagIDs[tagType]); // sets are serialized as arrays
        }
        return gameTagIDs;
    }

    // one-time compatibility layer. Converts GameObject jsons with tagID Sets and a Note, into GameObject jsons with a [Party] containing those
    legacyGamesAddParties(gameJsons) {
        return gameJsons.filter(Boolean).map(([id, gameJson]) => {
            const party = new Party({
                name: "Group 1",
                tagIDs: this.deserializeGameTagIDs(gameJson.tagIDs),
                note: gameJson.note,
            });
            return [id, { ...gameJson, parties: [party] }];
        });
    }

    populateGames(gameJsons, version) {
        if (version === "0.1.0") gameJsons = this.legacyGamesAddParties(gameJsons);
        const parseParties = (parties) => {
            return parties
                .filter((party) => {
                    if (!party || !party.id || !party.name) {
                        console.warn(`Skipping invalid party, id: ${party?.id}`);
                        return false;
                    }
                    return true;
                })
                .map((party) => {
                    return new Party({
                        ...party,
                        tagIDs: this.deserializeGameTagIDs(party.tagIDs),
                    });
                });
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
                .map(([id, gameJson]) => {
                    const game = new GameObject({
                        ...gameJson,
                        parties: parseParties(gameJson.parties),
                    });

                    return [id, game];
                }),
        );
    }

    populateReminders(reminderJsons) {
        this.allReminders = [];
        if (typeof reminderJsons !== "object" || !Array.isArray(reminderJsons))
            return console.warn("Skipping invalid tagOrderJsons.");
        this.allReminders = reminderJsons
            .filter((reminder) => !!reminder.id)
            .map((reminder) => {
                if (!reminder.partyID) {
                    // one-time conversion for reminders made before GameObjects had parties
                    const reminderGame = this.allGames.get(reminder.gameID);
                    reminder.partyID = reminderGame.parties[0].id;
                }
                return new ReminderObject({ ...reminder });
            });
    }

    /** @returns {ReminderObject[]} */
    get sortedReminders() {
        return this.allReminders.toSorted((a, b) => a.date - b.date);
    }

    /** @param {ReminderObject} reminder */
    addReminder(reminder) {
        if (!(reminder instanceof ReminderObject))
            return toastError("Invalid reminder object: " + reminder);
        if (this.allReminders.some((r) => r.id === reminder.id))
            return toastError("Reminder with this ID already exists");
        if (reminder.message.length === 0) return toastError("Reminder must have a message");

        this.allReminders.push(reminder);
        return toastSuccess("Reminder added");
    }

    removeReminder(reminder) {
        const index = this.allReminders.findIndex((r) => r.id === reminder.id);
        if (index === -1) return toastError("Error deleting reminder");
        this.allReminders.splice(index, 1);
        return toastSuccess("Reminder deleted");
    }

    editReminder(reminder, newDate, newMessage) {
        const index = this.allReminders.findIndex((r) => r.id === reminder.id);
        if (index === -1) return toastError("Error editing reminder");
        if (!(newDate instanceof Date)) return toastError("Invalid Date");
        if (typeof newMessage !== "string" || !newMessage.trim())
            return toastError("Invalid Message");

        this.allReminders[index].date = newDate;
        this.allReminders[index].message = newMessage;
        return toastSuccess("Reminder edited");
    }

    populateTagsCustomOrders(tagOrderJsons) {
        this.tagsCustomOrders = {
            [tT.friend]: [],
            [tT.category]: [],
            [tT.status]: [],
        };
        if (typeof tagOrderJsons !== "object")
            return console.warn("Skipping invalid tagOrderJsons.");
        if (Object.keys(tagOrderJsons).length === 0)
            return console.warn("Skipping empty tagOrderJsons.");
        this.tagsCustomOrders = tagOrderJsons;
    }

    moveTagCustomPosition(tagDragged, tagDroppedOn, direction) {
        const validTagsToReposition =
            tagDragged &&
            tagDroppedOn &&
            tagDragged instanceof TagObject &&
            tagDroppedOn instanceof TagObject &&
            tagDragged.type === tagDroppedOn.type;
        if (!validTagsToReposition)
            return console.warn(`Invalid tag reposition, tags: ${tagDragged}, ${tagDroppedOn}`);

        const orderArray = this.tagsCustomOrders[tagDragged.type];
        const indexDragged = orderArray.indexOf(tagDragged.id);
        const indexDroppedOn = orderArray.indexOf(tagDroppedOn.id);
        const indexToGoTo = indexDroppedOn + (direction === "bottom" ? 1 : 0);
        moveItemInArray(orderArray, indexDragged, indexToGoTo);
        this.tagsCustomOrders[tagDragged.type] = [...orderArray]; // triggers reaction
    }

    isDraggedTagDropzoneNotOnSelf(tagDragged, tagDraggedOver, direction) {
        // If dragging a tag during custom-sort rearrangement, and you're hovering on the top of the neighbor tag right below you, this lets you know there's no need to show an effect
        const validTagsToCheck =
            tagDragged &&
            tagDraggedOver &&
            tagDragged instanceof TagObject &&
            tagDraggedOver instanceof TagObject &&
            tagDragged.type === tagDraggedOver.type;
        if (!validTagsToCheck) return;

        const orderArray = this.tagsCustomOrders[tagDragged.type];
        const indexDragged = orderArray.indexOf(tagDragged.id);
        const indexDraggedOver = orderArray.indexOf(tagDraggedOver.id);
        const indexToGoTo = indexDraggedOver + (direction === "bottom" ? 1 : 0);

        return !(indexToGoTo === indexDragged || indexToGoTo === indexDragged + 1); // +1 is also self because of the shifting array calculation. -1 isn't.
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

        if ([...fullList.values()].some((t) => t.id === tag.id))
            return toastError(`This tag already exists in the ${tag.typeStrings.plural} list`);

        tag.name = ensureUniqueName(
            [...fullList.values()].map((t) => t.name),
            tag.name,
        );

        fullList.set(tag.id, tag);
        const orderList = this.tagsCustomOrders[tag.type];
        if (orderList && orderList.length > 0) orderList.push(tag.id); // if Custom Sort was ever selected, thus an order was made
        return toastSuccess(`Added ${tag.name} to ${tag.typeStrings.plural} list`);
    }

    deleteTag(tag) {
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        if (!this.allTags[tag.type].has(tag.id))
            return toastError(`${tag.name} does not exist in ${tag.typeStrings.plural} list`);

        this.allGames.forEach((game) => game.silentRemoveTag(tag));
        this.allTags[tag.type].delete(tag.id);
        deleteItemFromArray(this.tagsCustomOrders[tag.type], tag.id);
        return toastSuccess(`Deleted ${tag.name} from ${tag.typeStrings.plural} list`);
    }

    editTag(tag, newName) {
        if (tag.name === newName) return true; // nothing to do here, until adding more fields to edit
        // Editing needs to be in the DataStore rather than the object itself, to prevent duplicate names
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        const fullList = this.allTags[tag.type];
        const storedTag = fullList.get(tag.id);
        if (!storedTag)
            return toastError(`${tag.name} does not exist in ${tag.typeStrings.plural} list`);

        if (!newName || typeof newName !== "string" || !newName.trim())
            return toastError(`Cannot save a ${tag.typeStrings.single} without a name`);

        newName = ensureUniqueName(
            [...fullList.values()].map((t) => t.name),
            newName,
        );

        const oldName = tag.name;
        storedTag.name = newName;
        return toastSuccess(`Updated ${oldName} to ${newName} in ${tag.typeStrings.plural} list`);
    }

    allTagsFlatForEach(callbackfn) {
        for (const tagType in this.allTags) this.allTags[tagType].forEach(callbackfn);
    }

    updateAllTagTotalGamesCounters() {
        this.allTagsFlatForEach(
            (t) =>
                (t.totalGamesCount = [...this.allGames.values()].filter((game) =>
                    game.hasTag(t),
                ).length),
        );
    }

    updateTagTotalGamesCounter(tag) {
        const t = this.allTags[tag.type].get(tag.id);
        t.totalGamesCount = [...this.allGames.values()].filter((game) => game.hasTag(t)).length;
    }

    updateAllTagFilteredGamesCounters(filteredGames) {
        this.allTagsFlatForEach(
            (t) => (t.filteredGamesCount = filteredGames.filter((game) => game.hasTag(t)).length),
        );
    }

    updateTagFilteredGamesCounter(tag, filteredGames) {
        // used whenever adding/removing a tag from a game. not the prettiest, but is efficient
        const t = this.allTags[tag.type].get(tag.id);
        t.filteredGamesCount = filteredGames.filter((game) => game.hasTag(t)).length;
    }

    addGame(title, coverImageURL, sortingTitle, storeType, storeID, sgdbID) {
        if (!title) {
            toastError("Cannot save a game without a title");
            return null;
        }
        if (!coverImageURL) {
            toastError("Cannot save a game without selecting a cover image");
            return null;
        }
        if (storeType !== "custom" && !storeID) {
            toastError(
                `Cannot save a ${storeTypes[storeType]} game without selecting it from its search`,
            );
            return null;
        }
        const allGamesArray = [...this.allGames.values()];

        if (storeType !== "custom") {
            const identicalGame = allGamesArray.find(
                (g) => g.storeID === storeID && g.storeType === storeType, // Game with the same ID on the same store
            );
            if (identicalGame) {
                toastError(identicalGame.title + " already exists in the games list");
                return null;
            }
        }
        title = ensureUniqueName(
            allGamesArray.map((g) => g.title),
            title,
        );

        const newGame = new GameObject({
            title: title,
            coverImageURL: coverImageURL,
            sortingTitle: sortingTitle,
            storeType: storeType,
            storeID: storeID,
            sgdbID: sgdbID,
        });
        if (this.allGames.has(newGame.id))
            throw new Error("What do you MEAN this uuid already exists");
        this.allGames.set(newGame.id, newGame);
        toastSuccess("Added " + title + " to games list");
        return newGame; // used to open the GamePage right after adding the game
    }

    deleteGame(game) {
        const removed = this.allGames.delete(game.id);
        if (!removed) return toastError(`Failed to delete ${game.title} from games list`);

        for (const reminder of this.allReminders) {
            if (reminder.gameID === game.id) deleteItemFromArray(this.allReminders, reminder);
        }

        return toastSuccess(`Deleted ${game.title} from games list`);
    }

    editGame(game, title, coverImageURL, sortingTitle, storeType, storeID, sgdbID) {
        // Editing needs to be in the DataStore rather than the object itself, to prevent duplicate names
        if (!(game instanceof GameObject)) return toastError("Invalid game object: " + game);
        const storedGame = this.allGames.get(game.id);
        if (!storedGame) return toastError(`${game.title} does not exist in the games list`);
        if (!title || typeof title !== "string" || !title.trim())
            return toastError("Cannot save a game without a title");
        if (storeType !== "custom" && !storeID)
            return toastError(
                `Cannot save a ${storeTypes[storeType]} game without selecting it from its search`,
            );
        if (!coverImageURL) return toastError("Cannot save a game without a cover image");

        const allGamesArray = [...this.allGames.values()];
        if (storeType !== "custom") {
            // Looking for a different GameObject that has the same storeID from the same storeType
            const identicalGame = allGamesArray.find(
                (g) => g.storeID === storeID && g.storeType === storeType && g.id !== game.id,
            );
            if (identicalGame) {
                console.log(identicalGame.storeType);
                return toastError(identicalGame.title + " already exists in the games list");
            }
        }
        if (title.toLowerCase() !== game.title.toLowerCase()) {
            title = ensureUniqueName(
                allGamesArray.map((g) => g.title),
                title,
            );
        }

        const oldTitle = storedGame.title;
        storedGame.title = title;
        storedGame.coverImageURL = coverImageURL;
        storedGame.sortingTitle = sortingTitle;
        storedGame.storeType = storeType;
        storedGame.storeID = storeID;
        storedGame.sgdbID = sgdbID;
        if (oldTitle !== title) return toastSuccess(`Updated ${oldTitle} to ${storedGame.title}`);
        else return toastSuccess(`Updated ${storedGame.title}`);
    }

    sortTagsByMethod(tagType, sortMethod, isDescending) {
        // console.log("Sorting Tags of type " + tagType + ", by method " + sortMethod.name);
        const entriesArray = [...this.allTags[tagType].entries()];
        entriesArray.sort(([id1, tag1], [id2, tag2]) => sortMethod(tag1, tag2));
        if (isDescending) entriesArray.reverse();

        // Needs to be runInAction because used by autorun/reaction, which seems to lose binding otherwise
        runInAction(() => this.allTags[tagType].replace(entriesArray));
    }

    sortTagsByCustomOrder(tagType, isDescending) {
        const orderArray = this.tagsCustomOrders[tagType];
        if (!(orderArray.length > 0)) {
            orderArray.push(...this.allTags[tagType].keys());
            return;
        } // if no custom order yet, make one from the current order

        const entriesArray = new Array(orderArray.length);
        for (const [i, tagID] of this.tagsCustomOrders[tagType].entries())
            entriesArray[i] = [tagID, this.allTags[tagType].get(tagID)];
        if (isDescending) entriesArray.reverse();

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
        { fireImmediately: true },
    );
sortBySettingsReaction(tT.friend);
sortBySettingsReaction(tT.category);
sortBySettingsReaction(tT.status);

reaction(
    () => [globalSettingsStore.gameSortMethod, globalSettingsStore.gameSortDirection],
    (sortBy) => setGameSorting(sortBy[0], sortBy[1]),
    { fireImmediately: true },
);

function setTagSorting(tagType, sortSetting, sortDirection) {
    sortingReactions[tagType]?.disable();
    const isDescending = sortDirection === "desc";

    if (sortSetting === "custom") {
        sortingReactions[tagType] = new SortingReaction(
            () => dataStore.tagsCustomOrders[tagType],
            () => dataStore.sortTagsByCustomOrder(tagType, isDescending),
        );
    } else if (sortSetting === "name") {
        sortingReactions[tagType] = new SortingReaction(
            () => [[...dataStore.allTags[tagType]].map(([id, tag]) => tag.name)],
            () => dataStore.sortTagsByMethod(tagType, compareTagNamesAZ, isDescending),
        );
    } else if (sortSetting === "countFiltered") {
        sortingReactions[tagType] = new SortingReaction(
            () => [[...dataStore.allTags[tagType]].map(([id, tag]) => tag.filteredGamesCount)],
            () => dataStore.sortTagsByMethod(tagType, compareTagFilteredGamesCount, isDescending),
        );
    } else if (sortSetting === "countTotal") {
        sortingReactions[tagType] = new SortingReaction(
            () => [[...dataStore.allTags[tagType]].map(([id, tag]) => tag.totalGamesCount)],
            () => dataStore.sortTagsByMethod(tagType, compareTagTotalGamesCount, isDescending),
        );
    }
    sortingReactions[tagType]?.enable();
}

function setGameSorting(sortSetting, sortDirection) {
    sortingReactions.games?.disable();
    const isDescending = sortDirection === "desc";

    if (sortSetting === "title") {
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

export function ExportDataStoreToJSON() {
    return {
        [storageKeys[tT.friend]]: dataStore.allTags[tT.friend], // turning maps into arrays to stringify
        [storageKeys[tT.category]]: dataStore.allTags[tT.category],
        [storageKeys[tT.status]]: dataStore.allTags[tT.status],
        [storageKeys.games]: dataStore.allGames,
        [storageKeys.reminders]: dataStore.allReminders,
        [storageKeys.settings]: loadFromStorage(storageKeys.settings, {}),
        [storageKeys.defaultFilters]: loadFromStorage(storageKeys.defaultFilters, {}),
        [storageKeys.version]: version,
        [storageKeys.tagsCustomOrders]: dataStore.tagsCustomOrders,
    };
}

export function backupToFile() {
    console.log("Backing up data to file...");
    const data = ExportDataStoreToJSON();

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
        dataStore.populateTags(tagCollection);
        dataStore.populateGames(data[storageKeys.games], data[storageKeys.version]);
        dataStore.populateReminders(data[storageKeys.reminders]);
        dataStore.populateTagsCustomOrders(data[storageKeys.tagsCustomOrders]);
        // Load the settings to localstorage, and reload, which also populates the SettingsStore
        saveToStorage(storageKeys.settings, data[storageKeys.settings]);
        saveToStorage(storageKeys.defaultFilters, data[storageKeys.defaultFilters]);
        window.location.reload();
    });
    reader.readAsText(file);
}

// #==========================#
// ‖ FIRST VISIT DEFAULT TAGS ‖
// #==========================#
const firstVisit = loadFromStorage(storageKeys.visited, false) === false;
if (firstVisit && dataStore.allGames.size === 0) {
    dataStore.showTour = true;
    const defaultTagsSample = {
        [tT.friend]: [],
        [tT.category]: ["Playthrough", "Round-based", "Persistent World"],
        [tT.status]: ["Playing", "LFG", "Paused", "Backlog", "Abandoned", "Finished"],
    };
    dataStore.populateTagsFromTagNames(defaultTagsSample);
    const sortMethods = globalSettingsStore.tagSortMethods;
    for (const tagType in sortMethods) {
        if (sortMethods[tagType] === "custom") {
            dataStore.tagsCustomOrders[tagType].push(...dataStore.allTags[tagType].keys());
        }
    }
}
saveToStorage(storageKeys.visited, true);
saveToStorage(storageKeys.version, version);
