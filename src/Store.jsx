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
    title;
    friends = [];
    constructor(name) {
        this.title = name;
    }
    addFriend(friend) {
        this.friends.push(friend);
        console.log("Game: " + this.title + ", friends: " + this.friends);
    }
}

export const allGames = allGameNames.map((gameName) => {return new GameObject(gameName)});