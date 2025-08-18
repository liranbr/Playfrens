import { makeAutoObservable } from "mobx";
import { toastSuccess, toastError, compareAlphaIgnoreCase } from "@/Utils.jsx";
import { TagObject, tagTypes } from "@/models";

/**
 * @typedef {Object} GameObject
 * @property {string} title - The title of the game.
 * @property {string} coverImageURL - The path to the game's cover image file.
 * @property {string} sortingTitle - The (optional) title used for sorting the game.
 * @property {{[key: string]: Set<String>}} tagIDs - For each tagType, a set holds the game's contained tags by their ID
 * @property {string} note - A custom note for this game.
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
    id;

    constructor({ title, coverImageURL, sortingTitle, tagIDs, note, id }) {
        if (!title || !title.trim()) {
            throw new Error("GameObject must have a title");
        }
        this.title = title;
        this.coverImageURL = coverImageURL ?? this.coverImageURL;
        this.sortingTitle = sortingTitle ?? this.sortingTitle;
        this.tagIDs = tagIDs ?? this.tagIDs;
        this.note = note ?? this.note;
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

    hasTag(tag) {
        if (!(tag instanceof TagObject)) {
            console.error(`Invalid tag: ${tag}`);
            return false;
        }
        return this.tagIDs[tag.type].has(tag.id);
    }

    editGame(title, coverImageURL, sortingTitle) {
        if (!title) {
            toastError("Cannot save a game without a title");
            return false;
        }
        if (!coverImageURL) {
            toastError("Cannot save a game without a cover image");
            return false;
        }
        this.title = title;
        this.coverImageURL = coverImageURL;
        this.sortingTitle = sortingTitle;
        toastSuccess(`Updated ${this.title}`);
        return true;
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
