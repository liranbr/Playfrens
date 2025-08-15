import { makeAutoObservable } from "mobx";
import {
    insertAndSortByOrder,
    toastSuccess,
    toastError,
    compareAlphaIgnoreCase,
} from "@/Utils.jsx";
import { TagObject, tagTypes } from "@/models";

/**
 * @typedef {Object} GameObject
 * @property {string} title - The title of the game.
 * @property {string} coverImageURL - The path to the game's cover image file.
 * @property {string} sortingTitle - The (optional) title used for sorting the game.
 * @property {Array<TagObject>} friends - The list of friends for this game.
 * @property {Array<TagObject>} categories - The list of categories for this game.
 * @property {Array<TagObject>} statuses - The list of statuses for this game.
 * @property {string} note - A custom note for this game.
 * @property {string} id - A UUID identifier for the game object.
 */
export class GameObject {
    title;
    coverImageURL = "/missing_game_cover.png";
    sortingTitle = "";
    friends = [];
    categories = [];
    statuses = [];
    note = "";
    id;

    constructor({ title, coverImageURL, sortingTitle, friends, categories, statuses, note, id }) {
        if (!title || !title.trim()) {
            throw new Error("GameObject must have a title");
        }
        this.title = title;
        this.coverImageURL = coverImageURL ?? this.coverImageURL;
        this.sortingTitle = sortingTitle ?? this.sortingTitle;
        this.friends = friends ?? this.friends;
        this.categories = categories ?? this.categories;
        this.statuses = statuses ?? this.statuses;
        this.note = note ?? this.note;
        this.id = id ?? crypto.randomUUID();
        makeAutoObservable(this);
    }

    // TODO: Temp until three arrays become TagObject Sets/Maps
    /**
     * @returns {Array<TagObject>}
     */
    tagsList(tagType) {
        if (!tagType || !tagTypes.hasOwnProperty(tagType.key)) {
            console.error(`Unknown tag type: ${tagType?.key}`);
            return [];
        }
        const lists = {
            [tagTypes.friend.key]: this.friends,
            [tagTypes.category.key]: this.categories,
            [tagTypes.status.key]: this.statuses,
        };
        return lists[tagType.key] || [];
    }

    addTag(tag) {
        if (!(tag instanceof TagObject)) return console.error(`Invalid tag: ${tag}`);

        const tagsList = this.tagsList(tag.type);
        if (!tagsList.includes(tag)) {
            // insertAndSortByOrder(tag.name, tagsList, tagsSortOrder[tag.tagTypeKey]); TODO: Implement sorting functions in SettingsStore
            tagsList.push(tag.name); // TODO: Temp, lacking sorting
            toastSuccess(`Added ${tag.name} as a friend for ${this.title}`);
        } else toastError(`${tag.name} is already a ${tag.type.single} for ${this.title}`);
    }

    removeTag(tag) {
        if (!(tag instanceof TagObject)) return console.error(`Invalid tag: ${tag}`);

        const tagsList = this.tagsList(tag.type);
        const index = tagsList.indexOf(tag);
        if (index >= 0) {
            tagsList.splice(index, 1);
            toastSuccess(`Removed the ${tag.type.single} ${tag.name} from ${this.title}`);
        } else toastError(`${tag.name} is not a ${tag.type.single} for ${this.title}`);
    }

    hasTag(tag) {
        if (!(tag instanceof TagObject)) {
            console.error(`Invalid tag: ${tag}`);
            return false;
        }
        return this.tagsList(tag.type).some((t) => t.equals(tag));
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
        // globalDataStore.allGames.sort(compareGameTitles); TODO: Make sure editing a game triggers an allGames sort
        toastSuccess(`Updated ${this.title}`);
        return true;
    }

    setNote(note) {
        this.note = note;
    }

    toString() {
        return `Game Title: ${this.title}, sorting title: ${this.sortingTitle}, cover image URL: ${this.coverImageURL}, \n
        friends: ${this.friends}, categories: ${this.categories}, statuses: ${this.statuses}, \n
        note: ${this.note}, id: ${this.id}`;
    }
}

export function compareGameTitlesAZ(a, b) {
    const titleA = a.sortingTitle || a.title;
    const titleB = b.sortingTitle || b.title;
    return compareAlphaIgnoreCase(titleA, titleB);
}
