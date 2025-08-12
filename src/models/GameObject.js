import { makeAutoObservable } from "mobx";
import {
    compareGameTitles,
    insertAndSortByOrder,
    toastDataChangeSuccess,
    toastError,
} from "@/Utils.jsx";
import { globalDataStore, tagsSortOrder } from "@/stores";
import { tagTypes } from "@/models/TagTypes.js";

/**
 * @typedef {Object} GameObject
 * @property {string} title - The title of the game.
 * @property {string} coverImageURL - The path to the game's cover image file.
 * @property {string} sortingTitle - The (optional) title used for sorting the game.
 * @property {Array<string>} friends - The list of friends for this game.
 * @property {Array<string>} categories - The list of categories for this game.
 * @property {Array<string>} statuses - The list of statuses for this game.
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
        this.title = title ?? this.title;
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

    addTag(tagType, tagName) {
        if (!tagType || !tagTypes.hasOwnProperty(tagType.key) || !tagName) {
            console.error(`Unknown tag type: ${tagType?.key}`);
            return;
        }
        const tagsList = this.tagsList(tagType);
        if (!tagsList.includes(tagName)) {
            insertAndSortByOrder(tagName, tagsList, tagsSortOrder[tagType.key]);
            toastDataChangeSuccess(`Added ${tagName} as a friend for ${this.title}`);
        } else toastError(`${tagName} is already a ${tagType.single} for ${this.title}`);
    }

    removeTag(tagType, tagName) {
        if (!tagType || !tagTypes.hasOwnProperty(tagType.key) || !tagName) {
            console.error(`Unknown tag type: ${tagType?.key}`);
            return;
        }
        const tagsList = this.tagsList(tagType);
        const index = tagsList.indexOf(tagName);
        if (index >= 0) {
            tagsList.splice(index, 1);
            toastDataChangeSuccess(`Removed the ${tagType.single} ${tagName} from ${this.title}`);
        } else toastError(`${tagName} is not a ${tagType.single} for ${this.title}`);
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
        globalDataStore.allGames.sort(compareGameTitles);
        toastDataChangeSuccess(`Updated ${this.title}`);
        return true;
    }

    setNote(note) {
        this.note = note;
    }

    hasTag(tagType, tagName) {
        if (!tagType || !tagTypes.hasOwnProperty(tagType.key) || !tagName) {
            console.error(`Unknown tag type: ${tagType?.key}`);
            return;
        }
        return this.tagsList(tagType).includes(tagName);
    }

    toString() {
        return `Game Title: ${this.title}, sorting title: ${this.sortingTitle}, cover image URL: ${this.coverImageURL}, \n
        friends: ${this.friends}, categories: ${this.categories}, statuses: ${this.statuses}, \n
        note: ${this.note}, id: ${this.id}`;
    }
}
