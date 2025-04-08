import { toastError, toastSuccess } from "./Utils.jsx";
import { action, autorun, makeObservable, observable } from "mobx";

/**
 * @typedef {Object} GameObject
 * @property {string} title - The title of the game.
 * @property {string} imageCoverPath - The path to the game's cover image file.
 * @property {Array<string>} friends - The list of friends for this game.
 * @property {Array<string>} categories - The list of categories for this game.
 * @property {Array<string>} statuses - The list of statuses for this game.
 * @property {string} note - A custom note for this game.
 */
export class GameObject {
    constructor(title, imageCoverPath = "", friends = [], categories = [], statuses = [], note = "") {
        this.title = title;
        this.imageCoverPath = imageCoverPath;
        this.friends = friends;
        this.categories = categories;
        this.statuses = statuses;
        this.note = note;
        makeObservable(this, {
            title: observable,
            imageCoverPath: observable,
            friends: observable,
            categories: observable,
            statuses: observable,
            note: observable,
            addFriend: action,
            removeFriend: action,
            addCategory: action,
            removeCategory: action,
            addStatus: action,
            removeStatus: action,
            setNote: action
        });
    }

    addFriend(friend) {
        if (!this.friends.includes(friend)) {
            this.friends = [...this.friends, friend];
            toastSuccess(`Added ${friend} as a friend for ${this.title}`);
        } else {
            toastError(`${friend} is already a friend for ${this.title}`);
        }
    }

    removeFriend(friend) {
        if (this.friends.includes(friend)) {
            this.friends = this.friends.filter(f => f !== friend);
            toastSuccess(`Removed ${friend} from the ${this.title} friendslist`);
        } else {
            toastError(`${friend} is not a friend for ${this.title}`);
        }
    }

    addCategory(category) {
        if (!this.categories.includes(category)) {
            this.categories = [...this.categories, category];
            toastSuccess(`Added ${category} as a category for ${this.title}`);
        } else {
            toastError(`${category} is already a category for ${this.title}`);
        }
    }

    removeCategory(category) {
        if (this.categories.includes(category)) {
            this.categories = this.categories.filter(c => c !== category);
            toastSuccess(`Removed ${category} from ${this.title}'s categories`);
        } else {
            toastError(`${category} is not a category for ${this.title}`);
        }
    }

    addStatus(status) {
        if (!this.statuses.includes(status)) {
            this.statuses = [...this.statuses, status];
            toastSuccess(`Added ${status} as a status for ${this.title}`);
        } else {
            toastError(`${status} is already a status for ${this.title}`);
        }
    }

    removeStatus(status) {
        if (this.statuses.includes(status)) {
            this.statuses = this.statuses.filter(s => s !== status);
            toastSuccess(`Removed ${status} from ${this.title}'s statuses`);
        } else {
            toastError(`${status} is not a status for ${this.title}`);
        }
    }

    setNote(note) {
        this.note = note;
    }

    toJSON() {
        return {
            title: this.title,
            imageCoverPath: this.imageCoverPath,
            friends: this.friends,
            categories: this.categories,
            statuses: this.statuses,
            note: this.note
        };
    }

    toString() {
        return `Game Title: ${this.title}, friends: ${this.friends}, categories: ${this.categories}, statuses: ${this.statuses}, note: ${this.note}`;
    }
}

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
export const allGames = observable.array(loadObsArray("allGames").map(game =>
    new GameObject(game.title, game.imageCoverPath, game.friends, game.categories, game.statuses, game.note)));
// TODO: can the new GameObject skip specifying the properties?

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
        const data = JSON.parse(e.target.result);
        allFriends.replace(data["allFriends"]);
        allCategories.replace(data["allCategories"]);
        allStatuses.replace(data["allStatuses"]);
        allGames.replace(data["allGames"].map(game =>
            new GameObject(game.title, game.imageCoverPath, game.friends, game.categories, game.statuses, game.note)));
        window.location.reload();
    };
    reader.readAsText(file);
}