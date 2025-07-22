/**
 * @typedef {Object} tagType
 * @property {string} key - e.g. "friend", "category", "status".
 * @property {string} single - e.g. "Friend", "Category", "Status".
 * @property {string} plural - e.g. "Friends", "Categories", "Status".
 * @property {Array} allTagsList - The list of all tags of this type.
 * @property {function} gameTagsList - A function that returns the game's list of tags of this type.
 * @property {function} addToGame - A function to add a value to the game's list of tags of this type.
 * @property {function} removeFromGame - A function to remove a value from the game's list of tags of this type.
 */
export class tagType {
    constructor(key, single, plural, allTagsList, gameTagsList, addToGame, removeFromGame) {
        this.key = key;
        this.single = single;
        this.plural = plural;
        this.allTagsList = allTagsList;
        this.gameTagsList = gameTagsList;
        this.addToGame = addToGame;
        this.removeFromGame = removeFromGame;
    }
}

const friend = new tagType(
    "friend",
    "Friend",
    "Friends",
    [],
    (game) => game.friends,
    (game, value) => game.addFriend(value),
    (game, value) => game.removeFriend(value),
);
const category = new tagType(
    "category",
    "Category",
    "Categories",
    [],
    (game) => game.categories,
    (game, value) => game.addCategory(value),
    (game, value) => game.removeCategory(value),
);
const status = new tagType(
    "status",
    "Status",
    "Status",
    [],
    (game) => game.statuses,
    (game, value) => game.addStatus(value),
    (game, value) => game.removeStatus(value),
);

export const tagTypes = {
    friend,
    category,
    status,
};
