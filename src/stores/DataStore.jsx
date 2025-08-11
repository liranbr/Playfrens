import { action, autorun, observable } from "mobx";
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

function loadFromStorageObsArray(key) {
    return observable.array(loadFromStorage(key, []));
}

const visited = loadFromStorage("Visited", false);
const firstVisit = !visited;
if (firstVisit) {
    const defaultCategories = ["Playthrough", "Round-based", "Persistent World"];
    const defaultStatuses = ["Playing", "LFG", "Paused", "Backlog", "Abandoned", "Finished"];
    saveToStorage("allCategories", defaultCategories);
    saveToStorage("allStatuses", defaultStatuses);
    saveToStorage("Visited", true);
}

// export class DataStore {
//     // TODO: Replace with a Map of TagObjects
//     allTags = {
//         [tagTypes.friend.key]: loadFromStorageObsArray("allFriends").sort(compareAlphaIgnoreCase),
//         [tagTypes.category.key]: loadFromStorageObsArray("allCategories"),
//         [tagTypes.status.key]: loadFromStorageObsArray("allStatuses"),
//     };
// }

// load tags from localstorage as observables
export const allFriends = loadFromStorageObsArray("allFriends").sort(compareAlphaIgnoreCase);
export const allCategories = loadFromStorageObsArray("allCategories");
export const allStatuses = loadFromStorageObsArray("allStatuses");

export const tagsSortOrder = {
    [tagTypes.friend.key]: allFriends,
    [tagTypes.category.key]: allCategories,
    [tagTypes.status.key]: allStatuses,
};
tagTypes.friend.allTagsList = allFriends;
tagTypes.category.allTagsList = allCategories;
tagTypes.status.allTagsList = allStatuses;

export const allGames = observable.array(
    loadFromStorageObsArray("allGames")
        .filter((game) => {
            if (!game) console.warn("Skipping invalid game data:", game);
            return !!game;
        })
        .map((game) => new GameObject(game))
        .sort(compareGameTitles),
);

// when a change is made to an array, it is saved to localstorage
autorun(() => saveToStorage("allFriends", allFriends));
autorun(() => saveToStorage("allCategories", allCategories));
autorun(() => saveToStorage("allStatuses", allStatuses));
autorun(() => saveToStorage("allGames", allGames));

export function backupToFile() {
    console.log("Backing up data to file...");
    const data = {
        allFriends: allFriends,
        allCategories: allCategories,
        allStatuses: allStatuses,
        allGames: allGames,
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
        allFriends.replace(data["allFriends"]);
        allCategories.replace(data["allCategories"]);
        allStatuses.replace(data["allStatuses"]);
        allGames.replace(data["allGames"].map((game) => new GameObject(game)));
        saveToStorage(settingsKeyInStorage, data[settingsKeyInStorage]);
        window.location.reload();
    });
    reader.readAsText(file);
}

export const addTag = action((tagType, value) => {
    if (!value) {
        toastError("Cannot save a " + tagType.single + " without a name");
        return false;
    }
    if (tagType.allTagsList.includes(value)) {
        toastError(`${value} already exists in ${tagType.plural} list`);
        return false;
    }
    tagType.allTagsList.push(value);
    if (tagType.key === "friend") {
        tagType.allTagsList.sort(compareAlphaIgnoreCase);
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
    allGames.forEach((game) => {
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
    allGames.forEach((game) => {
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
    if (allGames.some((game) => game.title === title)) {
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
    allGames.push(newGame);
    allGames.sort(compareGameTitles);
    toastDataChangeSuccess("Added " + title + " to games list");
    return newGame;
});

export const removeGame = action((game) => {
    if (!allGames.includes(game)) {
        toastError(`${game.title} does not exist in games list`);
        return false;
    }
    allGames.remove(game);
    toastDataChangeSuccess("Removed " + game.title + " from games list");
    return true;
});
