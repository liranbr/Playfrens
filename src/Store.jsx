import {toastError, toastSuccess} from "./Utils.jsx";

export const allFriends = [
    "Sami",
    "Nibbix",
    "RocketDN",
    "MindHawk",
    "VX",
    "Cake",
    "Labreris",
    "Gooey",
    "shinn",
    "Bram",
    "wesje101",
    "Twinkle",
    "Vented",
    "MechArcana",
    "Tristan",
    "Xianji",
    "Sky",
    "Niv",
    "Aco"
];
export const allCategories = [
    "Playthroughs",
    "Round-based",
    "Plan To Play",
    "Later",
    "Finished"
];
export const allGameNames = [
    "Baldur's Gate 3",
    "Celeste",
    "CrossCode",
    "Dark Souls I Remastered",
    "Dead Cells",
    "Hades",
    "Heroes of the Storm",
    "Hollow Knight",
    "Tears of the Kingdom",
    "Outer Wilds",
    "Sekiro - Shadows Die Twice",
    "Subnautica",
    "Terraria",
    "Tunic",
    "V Rising",
    "The Witcher 3",
];

export class GameObject {
    title = "";
    friends = [];
    categories = [];

    constructor(name) {
        this.title = name;
    }

    addFriend(friend) {
        if (!this.friends.includes(friend)) {
            this.friends = [...this.friends, friend];
            toastSuccess("Added " + friend + " as a friend for " + this.title);
        } else {
            toastError(friend + " is already a friend for " + this.title);
        }
    }

    removeFriend(friend) {
        if (this.friends.includes(friend)) {
            this.friends = this.friends.filter(f => f !== friend);
            toastSuccess("Removed " + friend + " from " + this.title + "'s friends");
        } else {
            toastError(friend + " is not a friend for " + this.title);
        }
    }

    addCategory(category) {
        if (!this.categories.includes(category)) {
            this.categories.push(category);
            toastSuccess("Added " + category + " as a category for " + this.title);
        } else {
            toastError(category + " is already a category for " + this.title);
        }
    }

    removeCategory(category) {
        if (this.categories.includes(category)) {
            this.categories = this.categories.filter(c => c !== category);
            toastSuccess("Removed " + category + " from " + this.title + "'s categories");
        } else {
            toastError(category + " is not a category for " + this.title);
        }
    }

    toString() {
        return "Game Title: " + this.title + ", friends: " + this.friends + ", categories: " + this.categories;
    }
}

export const allGames = [...allGameNames].map((gameName) => {
    const gameObject = new GameObject(gameName);
    // TODO: Temp logic for testing filters
    if (gameName.includes(" "))
        gameObject.addFriend("Sami");
    else
        gameObject.addFriend("Nibbix");
    return gameObject;
});