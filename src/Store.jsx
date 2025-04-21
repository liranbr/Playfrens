import { autorun, observable } from "mobx";
import { GameObject } from "./models/GameObject.jsx";

function loadObsArray(key) {
    return observable.array(JSON.parse(localStorage.getItem(key) || "[]"));
}

function saveObsArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value, null, 4));
}

// load data from localstorage as observables
export const allFriends = loadObsArray("allFriends").sort((a, b) => a.localeCompare(b.toLowerCase()));
export const allCategories = loadObsArray("allCategories");
export const allStatuses = loadObsArray("allStatuses");
const dataSortOrder = {
    friends: allFriends,
    categories: allCategories,
    statuses: allStatuses
};

export const allGames = observable.array(loadObsArray("allGames").map(game => {
    if (!game) {
        console.warn("Skipping invalid game data:", game);
        return null;
    }
    return new GameObject(game.title, game.coverImagePath, game.friends, game.categories, game.statuses, game.note, dataSortOrder);
}).filter(game => game !== null));
// TODO: can the new GameObject skip specifying the properties, if they have the same name in the input?

// when a change is made to an array, it is saved to localstorage
autorun(() => saveObsArray("allFriends", allFriends));
autorun(() => saveObsArray("allCategories", allCategories));
autorun(() => saveObsArray("allStatuses", allStatuses));
autorun(() => saveObsArray("allGames", allGames));

export function saveDataToFile() {
    const data = {
        allFriends: allFriends,
        allCategories: allCategories,
        allStatuses: allStatuses,
        allGames: allGames
    };
    const blob = new Blob([JSON.stringify(data, null, 4)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "PlayfrensData.json";
    a.click();
    URL.revokeObjectURL(url);
}

export function loadDataFromFile(file) {
    console.log("Reading file...");
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = JSON.parse(e.target.result.toString());
        allFriends.replace(data["allFriends"]);
        allCategories.replace(data["allCategories"]);
        allStatuses.replace(data["allStatuses"]);
        allGames.replace(data["allGames"].map(game =>
            new GameObject(game.title, game.coverImagePath, game.friends, game.categories, game.statuses, game.note, dataSortOrder)));
        window.location.reload();
    };
    reader.readAsText(file);
}