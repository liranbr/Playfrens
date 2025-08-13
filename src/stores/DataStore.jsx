import { action, autorun, makeAutoObservable } from "mobx";
import { GameObject } from "@/models";
import { tagTypes } from "@/models";
import {
    compareAlphaIgnoreCase,
    compareGameTitles,
    loadFromStorage,
    saveToStorage,
    setToastSilence,
    toastSuccess,
    toastError,
} from "@/Utils.jsx";
import { settingsKeyInStorage } from "@/stores";
import { createContext, useContext } from "react";

export class DataStore {
    // TODO: Make allTags and allGames based on ID:Object Maps
    allTags = {
        [tagTypes.friend.key]: [],
        [tagTypes.category.key]: [],
        [tagTypes.status.key]: [],
    };
    allGames = [];

    constructor() {
        this.allGames = loadFromStorage("allGames", [])
            .filter((game) => {
                if (!game) console.warn("Skipping invalid game data:", game);
                return !!game;
            })
            .map((game) => new GameObject(game))
            .sort(compareGameTitles);

        this.allTags = {
            [tagTypes.friend.key]: loadFromStorage("allFriends", []).sort(compareAlphaIgnoreCase),
            [tagTypes.category.key]: loadFromStorage("allCategories", []),
            [tagTypes.status.key]: loadFromStorage("allStatuses", []),
        };

        makeAutoObservable(this);
    }

    addTag(tagType, value) {
        const fullList = dataStore.allTags[tagType.key];
        if (!value) return toastError("Cannot save a " + tagType.single + " without a name");
        if (fullList.includes(value))
            return toastError(`${value} already exists in ${tagType.plural} list`);

        fullList.push(value);
        if (tagType.key === "friend") fullList.sort(compareAlphaIgnoreCase); // TODO: Temp, replace after implementing tag sorting options
        return toastSuccess("Added " + value + " to " + tagType.plural + " list");
    }

    removeTag(tagType, value) {
        if (!dataStore.allTags[tagType.key].includes(value))
            return toastError(`${value} does not exist in ${tagType.plural} list`);

        setToastSilence(true);
        dataStore.allGames.forEach((game) => game.removeTag(tagType, value));
        dataStore.allTags[tagType.key].remove(value);
        setToastSilence(false);
        return toastSuccess("Removed " + value + " from " + tagType.plural + " list");
    }

    editTag(tagType, oldValue, newValue) {
        const fullList = dataStore.allTags[tagType.key];
        const oldValueIndex = fullList.indexOf(oldValue);
        if (!newValue) return toastError("Cannot save a " + tagType.single + " without a name");
        if (oldValueIndex === -1)
            return toastError(`${oldValue} does not exist in ${tagType.plural} list`);

        setToastSilence(true);
        fullList[oldValueIndex] = newValue;
        if (tagType.key === "friend") fullList.sort(compareAlphaIgnoreCase); // TODO: Temp, replace after implementing tag sorting options
        dataStore.allGames.forEach((game) => {
            if (game.tagsList(tagType).includes(oldValue)) {
                game.removeTag(tagType, oldValue);
                game.addTag(tagType, newValue);
            }
        });
        setToastSilence(false);
        return toastSuccess(`Updated ${oldValue} to ${newValue} in ${tagType.plural} list`);
    }

    addGame(title, coverImageURL, sortingTitle = "") {
        if (!title) {
            toastError("Cannot save a game without a title");
            return null;
        }
        // TODO: Reconsider duplicate game handling
        if (dataStore.allGames.some((game) => game.title === title)) {
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
        dataStore.allGames.push(newGame);
        dataStore.allGames.sort(compareGameTitles);
        toastSuccess("Added " + title + " to games list");
        return newGame;
    }

    removeGame(game) {
        const removed = dataStore.allGames.remove(game);
        if (!removed) return toastError(`Failed to remove ${game.title} from games list`);
        return toastSuccess("Removed " + game.title + " from games list");
    }
}

const dataStore = new DataStore();
// when a change is made to an array, it is saved to localstorage
autorun(() => saveToStorage("allFriends", dataStore.allTags[tagTypes.friend.key]));
autorun(() => saveToStorage("allCategories", dataStore.allTags[tagTypes.category.key]));
autorun(() => saveToStorage("allStatuses", dataStore.allTags[tagTypes.status.key]));
autorun(() => saveToStorage("allGames", dataStore.allGames));
// Prefer to use the context version in components, for expanded functionality in the future
// but the global version is available for non-component uses
const DataStoreContext = createContext(dataStore);
export const useDataStore = () => useContext(DataStoreContext);
export const globalDataStore = dataStore;

const firstVisit = !loadFromStorage("Visited", false);
if (firstVisit) {
    dataStore.allTags = {
        [tagTypes.friend.key]: [],
        [tagTypes.category.key]: ["Playthrough", "Round-based", "Persistent World"],
        [tagTypes.status.key]: ["Playing", "LFG", "Paused", "Backlog", "Abandoned", "Finished"],
    };
    saveToStorage("Visited", true);
}

export const tagsSortOrder = {
    [tagTypes.friend.key]: dataStore.allTags[tagTypes.friend.key],
    [tagTypes.category.key]: dataStore.allTags[tagTypes.category.key],
    [tagTypes.status.key]: dataStore.allTags[tagTypes.status.key],
};

export function backupToFile() {
    console.log("Backing up data to file...");
    const data = {
        allFriends: dataStore.allTags[tagTypes.friend.key],
        allCategories: dataStore.allTags[tagTypes.category.key],
        allStatuses: dataStore.allTags[tagTypes.status.key],
        allGames: dataStore.allGames,
        settings: loadFromStorage(settingsKeyInStorage, {}),
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
    console.log("Reading file...");
    const reader = new FileReader();
    reader.onload = action(function (e) {
        const data = JSON.parse(e.target.result.toString());
        dataStore.allTags[tagTypes.friend.key].replace(data["allFriends"]);
        dataStore.allTags[tagTypes.category.key].replace(data["allCategories"]);
        dataStore.allTags[tagTypes.status.key].replace(data["allStatuses"]);
        dataStore.allGames.replace(data["allGames"].map((game) => new GameObject(game)));
        dataStore.allGames.sort(compareGameTitles);
        saveToStorage(settingsKeyInStorage, data[settingsKeyInStorage]); // the rest are auto-saved by the autoruns
        window.location.reload();
    });
    reader.readAsText(file);
}
