import { action, autorun, observable, makeAutoObservable } from "mobx";
import { GameObject } from "@/models";
import { tagTypes } from "@/models";
import {
    compareAlphaIgnoreCase,
    compareGameTitles,
    loadFromStorage,
    saveToStorage,
    setToastSilence,
    toastDataChangeSuccess,
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
    allGames = observable.array([]);

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
}
const dataStore = new DataStore();
const DataStoreContext = createContext(dataStore);
export const useDataStore = () => useContext(DataStoreContext);
// Prefer to use the context version in components, for expanded functionality in the future
// but the global version is available for non-component uses
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
tagTypes.friend.allTagsList = dataStore.allTags[tagTypes.friend.key];
tagTypes.category.allTagsList = dataStore.allTags[tagTypes.category.key];
tagTypes.status.allTagsList = dataStore.allTags[tagTypes.status.key];

// when a change is made to an array, it is saved to localstorage
autorun(() => saveToStorage("allFriends", dataStore.allTags[tagTypes.friend.key]));
autorun(() => saveToStorage("allCategories", dataStore.allTags[tagTypes.category.key]));
autorun(() => saveToStorage("allStatuses", dataStore.allTags[tagTypes.status.key]));
autorun(() => saveToStorage("allGames", dataStore.allGames));

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

export const addTag = action((tagType, value) => {
    if (!value) {
        toastError("Cannot save a " + tagType.single + " without a name");
        return false;
    }
    if (dataStore.allTags[tagType.key].includes(value)) {
        toastError(`${value} already exists in ${tagType.plural} list`);
        return false;
    }
    dataStore.allTags[tagType.key].push(value);
    if (tagType.key === "friend") {
        dataStore.allTags[tagType.key].sort(compareAlphaIgnoreCase);
    }
    toastDataChangeSuccess("Added " + value + " to " + tagType.plural + " list");
    return true;
});

export const removeTag = action((tagType, value) => {
    if (!tagType.allTagsList.includes(value)) {
        toastError(`${value} does not exist in ${tagType.plural} list`);
        return false;
    }
    setToastSilence(true);
    dataStore.allGames.forEach((game) => {
        tagType.removeFromGame(game, value);
    });
    tagType.allTagsList.remove(value);
    setToastSilence(false);
    toastDataChangeSuccess("Removed " + value + " from " + tagType.plural + " list");
    return true;
});

export const editTag = action((tagType, oldValue, newValue) => {
    const fullList = tagType.allTagsList;
    if (!newValue) {
        toastError("Cannot save a " + tagType.single + " without a name");
        return false;
    }
    const oldValueIndex = fullList.indexOf(oldValue);
    if (oldValueIndex === -1) {
        toastError(`${oldValue} does not exist in ${tagType.plural} list`);
        return false;
    }
    setToastSilence(true);
    fullList[oldValueIndex] = newValue;
    if (tagType.key === "friend") {
        fullList.sort(compareAlphaIgnoreCase);
    }
    dataStore.allGames.forEach((game) => {
        if (tagType.gameTagsList(game).includes(oldValue)) {
            tagType.removeFromGame(game, oldValue);
            tagType.addToGame(game, newValue);
            toastDataChangeSuccess(`Updated ${oldValue} to ${newValue} in ${game.title}`);
        }
    });
    setToastSilence(false);
    toastDataChangeSuccess(`Updated ${oldValue} to ${newValue} in ${tagType.plural} list`);
    return true;
});

export const addGame = action((title, coverImageURL, gameSortingTitle = "") => {
    if (!title) {
        toastError("Cannot save a game without a title");
        return null;
    }
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
        sortingTitle: gameSortingTitle,
        friends: [],
        categories: [],
        statuses: [],
        note: "",
    });
    dataStore.allGames.push(newGame);
    dataStore.allGames.sort(compareGameTitles);
    toastDataChangeSuccess("Added " + title + " to games list");
    return newGame;
});

export const removeGame = action((game) => {
    if (!dataStore.allGames.includes(game)) {
        toastError(`${game.title} does not exist in games list`);
        return false;
    }
    dataStore.allGames.remove(game);
    toastDataChangeSuccess("Removed " + game.title + " from games list");
    return true;
});
