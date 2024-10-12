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
    "Playthrough",
    "Round-based",
    "Persistent World",
    "Plan To Play",
    "Later",
    "Finished"
];
// TODO: temp for testing, soon changing to JSON storage
export const allGameNamesAndCovers = {
    "Baldur's Gate 3": "https://cdn.cloudflare.steamstatic.com/steam/apps/1086940/library_600x900_2x.jpg",
    "Celeste": "https://cdn2.steamgriddb.com/grid/b2dfad356a40408faf455dcf85084f7d.png",
    "CrossCode": "https://cdn2.steamgriddb.com/grid/e0daea4d341688039c558c0095b9a30f.png",
    "Dark Souls I Remastered": "https://cdn2.steamgriddb.com/grid/0b6b193b8b26ae5875b6d4e4f69a4103.png",
    "Dead Cells": "https://cdn2.steamgriddb.com/grid/9a233d274515549314aeacfaf2702f25.png",
    "Hades": "https://cdn2.steamgriddb.com/grid/bfe339860b048949369fc6945cea504d.png",
    "Heroes of the Storm": "https://cdn2.steamgriddb.com/grid/9946800209f33bce8ba0dd67bf724ce5.png",
    "Hollow Knight": "https://cdn2.steamgriddb.com/grid/9122e6917c43df2c068332f00db0ff97.png",
    "Tears of the Kingdom": "https://cdn2.steamgriddb.com/grid/e38dfc6695227a26cb6aa312b997dccf.jpg",
    "Outer Wilds": "https://cdn2.steamgriddb.com/grid/ff9bc06bf30f5066e1be70b7fe1be7d6.png",
    "Sekiro - Shadows Die Twice": "https://cdn2.steamgriddb.com/grid/36b92582b9d1639873b06bcfe0e73635.png",
    "Subnautica": "https://cdn2.steamgriddb.com/grid/50896c8a37922749110dae272e7a345b.png",
    "Terraria": "https://cdn2.steamgriddb.com/grid/9bc661e8362657d8cbbe4bb41d17c7f3.png",
    "Tunic": "https://cdn2.steamgriddb.com/grid/a65b94d656df502d858e723807451382.png",
    "V Rising": "https://cdn2.steamgriddb.com/grid/bce13d4914a906527ba4098eeb929767.png",
    "The Witcher 3": "https://cdn2.steamgriddb.com/grid/67ac4b0f4d18ef599b7bf7253a83ef3c.png",
}

export class GameObject {
    title = "";
    imageCoverPath = "";
    friends = [];
    categories = [];

    constructor(name, imageCoverPath = "") {
        this.title = name;
        this.imageCoverPath = imageCoverPath;
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

    // continuing to replace with string literals
    addCategory(category) {
        if (!this.categories.includes(category)) {
            this.categories.push(category);
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

    toString() {
        return `Game Title: ${this.title}, friends: ${this.friends}, categories: ${this.categories}`;
    }
}

export const allGames = Object.entries(allGameNamesAndCovers).map(([gameName, coverPath]) => {
    const gameObject = new GameObject(gameName, coverPath);
    // TODO: Temp logic for testing filters
    if (gameName.includes(" "))
        gameObject.addFriend("Sami");
    else
        gameObject.addFriend("Nibbix");
    return gameObject;
});