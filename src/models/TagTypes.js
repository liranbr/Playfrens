/**
 * @typedef {Object} tagType
 * @property {string} key - e.g. "friend", "category", "status".
 * @property {string} single - e.g. "Friend", "Category", "Status".
 * @property {string} plural - e.g. "Friends", "Categories", "Status".
 */
export class tagType {
    constructor(key, single, plural) {
        this.key = key;
        this.single = single;
        this.plural = plural;
    }
}

export const tagTypes = {
    friend: new tagType("friend", "Friend", "Friends"),
    category: new tagType("category", "Category", "Categories"),
    status: new tagType("status", "Status", "Status"),
};
