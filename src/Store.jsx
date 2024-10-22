import { toastError, toastSuccess } from "./Utils.jsx";
import { action, autorun, makeObservable, observable, runInAction } from "mobx";

export class GameObject {
    constructor(title, imageCoverPath = "", friends = [], categories = []) {
        this.title = title;
        this.imageCoverPath = imageCoverPath;
        this.friends = friends;
        this.categories = categories;
        makeObservable(this, {
            title: observable,
            imageCoverPath: observable,
            friends: observable,
            categories: observable,
            addFriend: action,
            removeFriend: action,
            addCategory: action,
            removeCategory: action
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
            toastSuccess(`Removed ${friend} from ${this.title}'s friends`);
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

    toJSON() {
        return {
            title: this.title,
            imageCoverPath: this.imageCoverPath,
            friends: this.friends,
            categories: this.categories
        };
    }

    toString() {
        return `Game Title: ${this.title}, friends: ${this.friends}, categories: ${this.categories}`;
    }
}

function loadObsArray(key) {
    return observable.array(JSON.parse(localStorage.getItem(key) || "[]"));
}

function saveObsArray(key, value) {
    localStorage.setItem(key, JSON.stringify(value, null, 4));
}

// load data from localstorage as observables
export const allFriends = loadObsArray("allFriends");
export const allCategories = loadObsArray("allCategories");
export const allGames = observable.array(loadObsArray("allGames").map(game =>
    new GameObject(game.title, game.imageCoverPath, game.friends, game.categories)));

// when a change is made to an array, it is saved to localstorage
autorun(() => saveObsArray("allFriends", allFriends));
autorun(() => saveObsArray("allCategories", allCategories));
autorun(() => saveObsArray("allGames", allGames.map(game => game.toJSON())));

export function saveDataToFile() {
    const data = {
        allFriends: allFriends,
        allCategories: allCategories,
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
        runInAction(() => {
            allFriends.replace(data["allFriends"]);
            allCategories.replace(data["allCategories"]);
            allGames.replace(data["allGames"].map(game =>
                new GameObject(game.title, game.imageCoverPath, game.friends, game.categories)));
        });
        window.location.reload();
    };
    reader.readAsText(file);
}