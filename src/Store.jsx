import { action, autorun, observable } from "mobx";
import { GameObject } from "./models/GameObject.jsx";
import { tagTypes } from "./models/TagTypes.jsx";
import {
    compareAlphaIgnoreCase,
    compareGameTitles,
    setToastSilence,
    toastDataChangeSuccess,
    toastError,
} from "./Utils.jsx";

function loadObsArray(key) {
    return observable.array(JSON.parse(localStorage.getItem(key) || "[]"));
}

function saveObsArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value, null, 4));
}

const firstVisit = localStorage.getItem("Visited") === null;
if (firstVisit) {
    const defaultCategories = [
        "Playthrough",
        "Round-based",
        "Persistent World",
    ];
    const defaultStatuses = [
        "Playing",
        "LFG",
        "Paused",
        "Backlog",
        "Abandoned",
        "Finished",
    ];
    localStorage.setItem(
        "allCategories",
        JSON.stringify(defaultCategories, null, 4),
    );
    localStorage.setItem(
        "allStatuses",
        JSON.stringify(defaultStatuses, null, 4),
    );
    localStorage.setItem("Visited", "true");
}

// load tags from localstorage as observables
export const allFriends = loadObsArray("allFriends").sort(
    compareAlphaIgnoreCase,
);
export const allCategories = loadObsArray("allCategories");
export const allStatuses = loadObsArray("allStatuses");
const tagsSortOrder = {
    friends: allFriends,
    categories: allCategories,
    statuses: allStatuses,
};
tagTypes.friend.allTagsList = allFriends;
tagTypes.category.allTagsList = allCategories;
tagTypes.status.allTagsList = allStatuses;

export const allGames = observable.array(
    loadObsArray("allGames")
        .map((game) => {
            if (!game) {
                console.warn("Skipping invalid game data:", game);
                return null;
            }
            return new GameObject(
                game.title,
                game.coverImageURL || game.coverImagePath,
                game.sortingTitle,
                game.friends,
                game.categories,
                game.statuses,
                game.note,
                tagsSortOrder,
            );
        })
        .filter((game) => game !== null)
        .sort(compareGameTitles),
);

// when a change is made to an array, it is saved to localstorage
autorun(() => saveObsArray("allFriends", allFriends));
autorun(() => saveObsArray("allCategories", allCategories));
autorun(() => saveObsArray("allStatuses", allStatuses));
autorun(() => saveObsArray("allGames", allGames));

export function backupToFile() {
    const data = {
        allFriends: allFriends,
        allCategories: allCategories,
        allStatuses: allStatuses,
        allGames: allGames,
    };
    const blob = new Blob([JSON.stringify(data, null, 4)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date()
        .toISOString()
        .split(".")[0]
        .replace("T", " ")
        .replaceAll(":", "-");
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
        allGames.replace(
            data["allGames"].map(
                (game) =>
                    new GameObject(
                        game.title,
                        game.coverImageURL || game.coverImagePath,
                        game.sortingTitle,
                        game.friends,
                        game.categories,
                        game.statuses,
                        game.note,
                        tagsSortOrder,
                    ),
            ),
        );
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
    toastDataChangeSuccess(
        "Added " + value + " to " + tagType.plural + " list",
    );
    return true;
});

export const removeTag = action((tagType, value) => {
    if (!tagType.allTagsList.includes(value)) {
        toastError(`${value} does not exist in ${tagType.plural} list`);
        return false;
    }
    // TODO: Add Modal Confirmation
    setToastSilence(true);
    allGames.forEach((game) => {
        tagType.removeFromGame(game, value);
    });
    tagType.allTagsList.remove(value);
    setToastSilence(false);
    toastDataChangeSuccess(
        "Removed " + value + " from " + tagType.plural + " list",
    );
    return true;
});

export const EditData = action((tagType, oldValue, newValue) => {
    // TODO: Fix Editing a data that's an active filter
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
            toastDataChangeSuccess(
                `Updated ${oldValue} to ${newValue} in ${game.title}`,
            );
        }
    });
    setToastSilence(false);
    toastDataChangeSuccess(
        `Updated ${oldValue} to ${newValue} in ${tagType.plural} list`,
    );
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
    const newGame = new GameObject(
        title,
        coverImageURL,
        gameSortingTitle,
        [],
        [],
        [],
        "",
        tagsSortOrder,
    );
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
