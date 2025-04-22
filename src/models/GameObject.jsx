import { toastError, toastDataChangeSuccess, insertSortedByOrder } from "../Utils.jsx";
import { action, makeObservable, observable } from "mobx";

/**
 * @typedef {Object} GameObject
 * @property {string} title - The title of the game.
 * @property {string} coverImagePath - The path to the game's cover image file.
 * @property {Array<string>} friends - The list of friends for this game.
 * @property {Array<string>} categories - The list of categories for this game.
 * @property {Array<string>} statuses - The list of statuses for this game.
 * @property {string} note - A custom note for this game.
 * @property {{ friends: Array<string>, categories: Array<string>, statuses: Array<string> }} dataSortOrder - The order to sort data by, usually the full lists
 */
export class GameObject {
    constructor(title, coverImagePath = "/missing_game_cover.png", friends = [], categories = [], statuses = [], note = "", dataSortOrder = {}) {
        this.title = title;
        this.coverImagePath = coverImagePath;
        this.friends = friends;
        this.categories = categories;
        this.statuses = statuses;
        this.note = note;
        this.dataSortOrder = dataSortOrder;
        makeObservable(this, {
            title: observable,
            coverImagePath: observable,
            friends: observable,
            categories: observable,
            statuses: observable,
            note: observable,
            dataSortOrder: observable,
            addFriend: action,
            removeFriend: action,
            addCategory: action,
            removeCategory: action,
            addStatus: action,
            removeStatus: action,
            setNote: action
        });
    }

    addFriend(friend) {
        if (!this.friends.includes(friend)) {
            this.friends = insertSortedByOrder(friend, this.friends, this.dataSortOrder.friends);
            toastDataChangeSuccess(`Added ${friend} as a friend for ${this.title}`);
        } else {
            toastError(`${friend} is already a friend for ${this.title}`);
        }
    }

    removeFriend(friend) {
        if (this.friends.includes(friend)) {
            this.friends = this.friends.filter(f => f !== friend);
            toastDataChangeSuccess(`Removed ${friend} from the ${this.title} friendslist`);
        } else {
            toastError(`${friend} is not a friend for ${this.title}`);
        }
    }

    addCategory(category) {
        if (!this.categories.includes(category)) {
            this.categories = insertSortedByOrder(category, this.categories, this.dataSortOrder.categories);
            toastDataChangeSuccess(`Added ${category} as a category for ${this.title}`);
        } else {
            toastError(`${category} is already a category for ${this.title}`);
        }
    }

    removeCategory(category) {
        if (this.categories.includes(category)) {
            this.categories = this.categories.filter(c => c !== category);
            toastDataChangeSuccess(`Removed ${category} from ${this.title}'s categories`);
        } else {
            toastError(`${category} is not a category for ${this.title}`);
        }
    }

    addStatus(status) {
        if (!this.statuses.includes(status)) {
            this.statuses = insertSortedByOrder(status, this.statuses, this.dataSortOrder.statuses);
            toastDataChangeSuccess(`Added ${status} as a status for ${this.title}`);
        } else {
            toastError(`${status} is already a status for ${this.title}`);
        }
    }

    removeStatus(status) {
        if (this.statuses.includes(status)) {
            this.statuses = this.statuses.filter(s => s !== status);
            toastDataChangeSuccess(`Removed ${status} from ${this.title}'s statuses`);
        } else {
            toastError(`${status} is not a status for ${this.title}`);
        }
    }

    setNote(note) {
        this.note = note;
    }

    toJSON() {
        return {
            title: this.title,
            coverImagePath: this.coverImagePath,
            friends: this.friends,
            categories: this.categories,
            statuses: this.statuses,
            note: this.note
        };
    }

    toString() {
        return `Game Title: ${this.title}, friends: ${this.friends}, categories: ${this.categories}, statuses: ${this.statuses}, note: ${this.note}`;
    }
}