import { makeAutoObservable } from "mobx";
import { compareAlphaIgnoreCase } from "@/Utils.jsx";

/**
 * @typedef {Object} TagType
 * @property {string} key - e.g. "friend", "category", "status".
 * @property {string} single - e.g. "Friend", "Category", "Status".
 * @property {string} plural - e.g. "Friends", "Categories", "Status".
 * @property {string} storageKey - e.g. "allFriends", "allCategories", "allStatuses".
 */
export class TagType {
    constructor(key, single, plural, storageKey) {
        this.key = key;
        this.single = single;
        this.plural = plural;
        this.storageKey = storageKey;
    }
}

/**
 * @typedef {Object} tagTypes
 * @property {TagType} friend
 * @property {TagType} category
 * @property {TagType} status
 */
export const tagTypes = {
    friend: new TagType("friend", "Friend", "Friends", "allFriends"),
    category: new TagType("category", "Category", "Categories", "allCategories"),
    status: new TagType("status", "Status", "Status", "allStatuses"),
};

export class TagObject {
    tagTypeKey;
    name;
    id;
    constructor({ tagTypeKey, name, id }) {
        if (!tagTypes[tagTypeKey]) throw new Error(`Invalid tag type: ${tagTypeKey}`);
        if (!name || typeof name !== "string" || !name.trim())
            throw new Error("TagObject must have a valid name");
        if (id && (typeof id !== "string" || !id.trim()))
            throw new Error("TagObject ID must be a valid string or undefined");

        this.tagTypeKey = tagTypeKey;
        this.name = name;
        this.id = id ?? crypto.randomUUID();
        makeAutoObservable(this);
    }

    get type() {
        return tagTypes[this.tagTypeKey];
    }

    equals(other) {
        return (
            other instanceof TagObject &&
            this.id === other.id &&
            this.tagTypeKey === other.tagTypeKey &&
            this.name === other.name
        );
    }

    toString() {
        return `TagObject, id: ${this.id}, tagTypeKey: ${this.tagTypeKey}, name: ${this.name}`;
    }
}

// for later, when Friends get unique properties like DiscordID, SteamID, ProfilePictureURL, etc.
class FriendTagObject extends TagObject {
    constructor(name, id) {
        super({ tagTypeKey: tagTypes.friend.key, name: name, id: id });
    }
}

export function compareTagNamesAZ(a, b) {
    return compareAlphaIgnoreCase(a.name, b.name);
}
