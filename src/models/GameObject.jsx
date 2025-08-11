import { makeAutoObservable } from "mobx";
import {
    compareGameTitles,
    insertSortedByOrder,
    toastDataChangeSuccess,
    toastError,
} from "@/Utils.jsx";
import { allGames, tagsSortOrder } from "@/stores";
import { tagTypes } from "@/models/TagTypes.jsx";

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

    addFriend(friend) {
        if (!this.friends.includes(friend)) {
            this.friends = insertSortedByOrder(
                friend,
                this.friends,
                tagsSortOrder[tagTypes.friend.key],
            );
            toastDataChangeSuccess(`Added ${friend} as a friend for ${this.title}`);
        } else {
            toastError(`${friend} is already a friend for ${this.title}`);
        }
    }

    removeFriend(friend) {
        if (this.friends.includes(friend)) {
            this.friends = this.friends.filter((f) => f !== friend);
            toastDataChangeSuccess(`Removed ${friend} from the ${this.title} friendslist`);
        } else {
            toastError(`${friend} is not a friend for ${this.title}`);
        }
    }

    addCategory(category) {
        if (!this.categories.includes(category)) {
            this.categories = insertSortedByOrder(
                category,
                this.categories,
                tagsSortOrder[tagTypes.category.key],
            );
            toastDataChangeSuccess(`Added ${category} as a category for ${this.title}`);
        } else {
            toastError(`${category} is already a category for ${this.title}`);
        }
    }

    removeCategory(category) {
        if (this.categories.includes(category)) {
            this.categories = this.categories.filter((c) => c !== category);
            toastDataChangeSuccess(`Removed ${category} from ${this.title}'s categories`);
        } else {
            toastError(`${category} is not a category for ${this.title}`);
        }
    }

    addStatus(status) {
        if (!this.statuses.includes(status)) {
            this.statuses = insertSortedByOrder(
                status,
                this.statuses,
                tagsSortOrder[tagTypes.status.key],
            );
            toastDataChangeSuccess(`Added ${status} as a status for ${this.title}`);
        } else {
            toastError(`${status} is already a status for ${this.title}`);
        }
    }

    removeStatus(status) {
        if (this.statuses.includes(status)) {
            this.statuses = this.statuses.filter((s) => s !== status);
            toastDataChangeSuccess(`Removed ${status} from ${this.title}'s statuses`);
        } else {
            toastError(`${status} is not a status for ${this.title}`);
        }
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
        allGames.sort(compareGameTitles);
        toastDataChangeSuccess(`Updated ${this.title}`);
        return true;
    }

    setNote(note) {
        this.note = note;
    }

    hasTag(tagType, tagName) {
        switch (tagType?.key) {
            case tagTypes.friend.key:
                return this.friends.includes(tagName);
            case tagTypes.category.key:
                return this.categories.includes(tagName);
            case tagTypes.status.key:
                return this.statuses.includes(tagName);
            default:
                console.error(`Unknown tag type: ${tagType?.key}`);
                return false;
        }
    }

    toString() {
        return `Game Title: ${this.title}, sorting title: ${this.sortingTitle}, cover image URL: ${this.coverImageURL}, \n
        friends: ${this.friends}, categories: ${this.categories}, statuses: ${this.statuses}, \n
        note: ${this.note}, id: ${this.id}`;
    }
}
