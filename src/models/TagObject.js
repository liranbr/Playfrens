import { makeAutoObservable } from "mobx";
import { compareAlphaIgnoreCase } from "@/Utils.jsx";

export const tagTypes = {
    friend: "friend",
    category: "category",
    status: "status",
};

/**
 * @typedef {Object} TagTypeStrings
 * @property {string} key - e.g. "friend", "category", "status".
 * @property {string} single - e.g. "Friend", "Category", "Status".
 * @property {string} plural - e.g. "Friends", "Categories", "Status".
 */
export class TagTypeStrings {
    constructor(key, single, plural) {
        this.key = key;
        this.single = single;
        this.plural = plural;
    }
}

/**
 * @typedef {Object} tagTypeStrings
 * @property {TagTypeStrings} friend
 * @property {TagTypeStrings} category
 * @property {TagTypeStrings} status
 */
export const tagTypeStrings = {
    friend: new TagTypeStrings("friend", "Friend", "Friends"),
    category: new TagTypeStrings("category", "Category", "Categories"),
    status: new TagTypeStrings("status", "Status", "Status"),
};

/**
 * @property {String} type
 * @property {String} name
 * @property {String} id
 * @property {TagTypeStrings} typeStrings
 */
export class TagObject {
    type;
    name;
    id;
    constructor({ type, name, id }) {
        if (!tagTypes[type]) throw new Error(`Invalid tag type: ${type}`);
        if (!name || typeof name !== "string" || !name.trim())
            throw new Error("TagObject must have a valid name");
        if (id && (typeof id !== "string" || !id.trim()))
            throw new Error("TagObject ID must be a valid string or undefined");

        this.type = type;
        this.name = name;
        this.id = id ?? crypto.randomUUID();
        makeAutoObservable(this);
    }

    /** @type {TagTypeStrings} */
    get typeStrings() {
        return tagTypeStrings[this.type];
    }

    equals(other) {
        return (
            other instanceof TagObject &&
            this.id === other.id &&
            this.type === other.type &&
            this.name === other.name
        );
    }

    toString() {
        return `TagObject, id: ${this.id}, tagType: ${this.type}, name: ${this.name}`;
    }
}

// for later, when Friends get unique properties like DiscordID, SteamID, ProfilePictureURL, etc.
class FriendTagObject extends TagObject {
    constructor(name, id) {
        super({ type: tagTypes.friend, name: name, id: id });
    }
}

export function compareTagNamesAZ(a, b) {
    return compareAlphaIgnoreCase(a.name, b.name);
}
