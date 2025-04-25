import { allFriends, allCategories, allStatuses } from "../Store.jsx";

/**
 * @typedef {Object} dataType
 * @property {string} key - e.g. "friend", "category", "status".
 * @property {string} single - e.g. "Friend", "Category", "Status".
 * @property {string} plural - e.g. "Friends", "Categories", "Status".
 * @property {string} placeholder - for empty input fields.
 * @property {Array} allDataList - The list of all data of this type.
 * @property {function} gameDataList - A function that returns the game's list of data of this type.
 * @property {function} add - A function to add a value to the game's list of data of this type.
 * @property {function} remove - A function to remove a value from the game's list of data of this type.
 */
export class dataType {
    constructor(key, single, plural, placeholder, allDataList, gameDataList, add, remove) {
        this.key = key;
        this.single = single;
        this.plural = plural;
        this.placeholder = placeholder;
        this.allDataList = allDataList;
        this.gameDataList = gameDataList;
        this.add = add;
        this.remove = remove;
    }
}

const friend = new dataType(
    "friend",
    "Friend",
    "Friends",
    "Buddy?",
    allFriends,
    (game) => game.friends,
    (game, value) => game.addFriend(value),
    (game, value) => game.removeFriend(value)
);
const category = new dataType(
    "category",
    "Category",
    "Categories",
    "Favorites?",
    allCategories,
    (game) => game.categories,
    (game, value) => game.addCategory(value),
    (game, value) => game.removeCategory(value)
);
const status = new dataType(
    "status",
    "Status",
    "Status",
    "Wishlist?",
    allStatuses,
    (game) => game.statuses,
    (game, value) => game.addStatus(value),
    (game, value) => game.removeStatus(value)
);

export const dataTypes = {
    friend,
    category,
    status
};