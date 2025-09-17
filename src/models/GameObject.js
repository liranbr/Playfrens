import { makeAutoObservable } from "mobx";
import { toastSuccess, toastError, compareAlphaIgnoreCase } from "@/Utils.jsx";
import { TagObject, tagTypes } from "@/models";

export const storeTypes = Object.freeze({
    steam: "Steam",
    gog: "GOG",
    xbox: "Xbox",
    egs: "the Epic Games Store",
    bnet: "Battle.net",
    custom: "Custom",
});

/**
 * @class
 * @property {string} title - The title of the game.
 * @property {string} coverImageURL - The path to the game's cover image file.
 * @property {string} sortingTitle - The (optional) title used for sorting the game.
 * @property {{[key: string]: Set<String>}} tagIDs - For each tagType, a set holds the game's contained tags by their ID
 * @property {string} note - A custom note for this game.
 * @property {string} storeType - Store that the game is from, options in storeTypes, like 'steam', 'gog'. Can be none.
 * @property {string} storeID - ID of the Game on its store.
 * @property {string} sgdbID - ID of the Game on SteamGridDB. Usually derived from storeType+ID, but can be independent.
 * @property {string} id - A UUID identifier for the game object.
 */
export class GameObject {
    title;
    coverImageURL = "/missing_game_cover.png";
    sortingTitle = "";
    tagIDs = {
        [tagTypes.friend]: new Set(),
        [tagTypes.category]: new Set(),
        [tagTypes.status]: new Set(),
    };
    note = "";
    storeType = "custom";
    storeID = "";
    sgdbID = "";
    id; // UUID

    constructor({
        title,
        coverImageURL,
        sortingTitle,
        tagIDs,
        note,
        storeType,
        storeID,
        sgdbID,
        id,
    }) {
        this.title = title;
        this.coverImageURL = coverImageURL ?? this.coverImageURL;
        this.sortingTitle = sortingTitle ?? this.sortingTitle;
        this.tagIDs = tagIDs ?? this.tagIDs;
        this.note = note ?? this.note;
        this.storeType = storeType ?? this.storeType;
        this.storeID = storeID ?? this.storeID;
        this.sgdbID = sgdbID ?? this.sgdbID;
        this.id = id ?? crypto.randomUUID();
        makeAutoObservable(this);
    }

    addTag(tag) {
        if (!(tag instanceof TagObject)) return console.error(`Invalid tag: ${tag}`);

        const tagIDsSet = this.tagIDs[tag.type];
        if (!tagIDsSet.has(tag.id)) {
            tagIDsSet.add(tag.id);
            toastSuccess(`Added ${tag.name} as a ${tag.typeStrings.single} for ${this.title}`);
        } else toastError(`${tag.name} is already a ${tag.typeStrings.single} for ${this.title}`);
    }

    removeTag(tag) {
        if (!(tag instanceof TagObject)) return console.error(`Invalid tag: ${tag}`);

        const tagIDsSet = this.tagIDs[tag.type];
        if (tagIDsSet.delete(tag.id)) {
            toastSuccess(`Removed the ${tag.typeStrings.single} ${tag.name} from ${this.title}`);
        } else toastError(`${tag.name} is not a ${tag.typeStrings.single} for ${this.title}`);
    }

    // used on all games when deleting a tag from the DataStore, to avoid spamming toasts
    silentRemoveTag(tag) {
        if (!(tag instanceof TagObject)) return console.error(`Invalid tag: ${tag}`);
        this.tagIDs[tag.type].delete(tag.id);
    }

    hasTag(tag) {
        if (!(tag instanceof TagObject)) {
            console.error(`Invalid tag: ${tag}`);
            return false;
        }
        return this.tagIDs[tag.type].has(tag.id);
    }

    setNote(note) {
        this.note = note;
    }

    toString() {
        return `Game Title: ${this.title}, Game ID: ${this.id}`;
    }
}

export function compareGameTitlesAZ(a, b) {
    const titleA = a.sortingTitle || a.title;
    const titleB = b.sortingTitle || b.title;
    return compareAlphaIgnoreCase(titleA, titleB);
}
