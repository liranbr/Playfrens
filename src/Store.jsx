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
    "Outer Wilds",
    "Sekiro - Shadows Die Twice",
    "Subnautica",
    "Tears of the Kingdom",
    "Terraria",
    "Tunic",
    "V Rising",
    "The Witcher 3",
];

export class GameObject {
    title = "empty modal";
    friends = [];
    categories = [];

    constructor(name) {
        this.title = name;
    }

    addFriend(friend) {
        this.friends.push(friend);
        console.log("Added Friend: " + friend + " to Game: " + this.title);
    }

    addCategory(category) {
        this.categories.push(category);
        console.log("Added Category: " + category + " to Game: " + this.title);
    }

    toString() {
        return "GameObject: title: " + this.title + ", friends: " + this.friends + ", categories: " + this.categories;
    }
}

export const allGames = allGameNames.map((gameName) => {
    const gameObject = new GameObject(gameName);
    // TODO: Temp logic for testing filters
    if (gameName.includes(" "))
        gameObject.addFriend("Sami");
    else
        gameObject.addFriend("Nibbix");
    return gameObject;
});