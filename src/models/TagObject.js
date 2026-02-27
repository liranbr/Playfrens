import { makeAutoObservable, makeObservable, observable } from "mobx";
import { compareAlphaIgnoreCase } from "@/Utils.jsx";
import { v4 as randomUUID } from "uuid";

export const tagTypes = {
    friend: "friend",
    category: "category",
    status: "status",
};

/**
 * @class
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
 * @property {Number} filteredGamesCount
 * @property {Number} totalGamesCount
 * @property {TagTypeStrings} typeStrings
 */
export class TagObject {
    type;
    name;
    id;
    filteredGamesCount;
    totalGamesCount;
    constructor({ type, name, id }) {
        if (!tagTypes[type]) throw new Error(`Invalid tag type: ${type}`);
        if (!name || typeof name !== "string" || !name.trim())
            throw new Error("TagObject must have a valid name");
        if (id && (typeof id !== "string" || !id.trim()))
            throw new Error("TagObject ID must be a valid string or undefined");

        this.type = type;
        this.name = name;
        this.id = id ?? randomUUID();
        this.filteredGamesCount = 0;
        this.totalGamesCount = 0;
        makeObservable(this, {
            type: observable,
            name: observable,
            id: observable,
            filteredGamesCount: observable,
            totalGamesCount: observable,
        });
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

    toJSON() {
        return {
            type: this.type,
            name: this.name,
            id: this.id,
        };
        // no reason to store the filteredGamesCount
    }

    toString() {
        return `${this.constructor.name}, id: ${this.id}, tagType: ${this.type}, name: ${this.name}`;
    }
}

// for later, when Friends get unique properties like DiscordID, SteamID, ProfilePictureURL, etc.
export class FriendTagObject extends TagObject {
    steamID = "";
    iconURL = "";
    constructor({ name, id, steamID, iconURL }) {
        super({ type: tagTypes.friend, name: name, id: id });
        this.steamID = steamID;
        this.iconURL = iconURL;
        makeObservable(this, {
            steamID: observable,
            iconURL: observable,
        });
    }

    toJSON() {
        const obj = super.toJSON();
        return {
            ...obj,
            steamID: this.steamID,
            iconURL: this.iconURL,
        };
    }

    toString() {
        const result = super.toString();
        return `${result}, steamID: ${this.steamID}, iconURL: ${this.iconURL}`;
    }
    /**
     * Only for data that we would like to keep updating without hurting the user's setup.
     *
     * For now, only Steam Avatars.
     */
    updateSteamData({ iconURL }) {
        let dataChanged = false;
        if (iconURL !== undefined && iconURL !== this.iconURL) {
            this.iconURL = iconURL;
            dataChanged = true;
        }
        return dataChanged;
    }
}

export function compareTagNamesAZ(a, b) {
    return compareAlphaIgnoreCase(a.name, b.name);
}

export function compareTagFilteredGamesCount(a, b) {
    const comparison = a.filteredGamesCount - b.filteredGamesCount;
    if (comparison !== 0) return comparison;
    else return compareTagNamesAZ(a, b);
}

export function compareTagTotalGamesCount(a, b) {
    const comparison = a.totalGamesCount - b.totalGamesCount;
    if (comparison !== 0) return comparison;
    else return compareTagNamesAZ(a, b);
}
