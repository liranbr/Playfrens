import { toast } from "react-toastify";

let silentToasts = false;

export function setToastSilence(silence) {
    silentToasts = silence;
}

/**
 * @param {string} message
 * @returns {true}
 */
export function toastSuccess(message) {
    if (!silentToasts) toast.success(message);
    return true;
}

/**
 * @param {string} message
 * @returns {false}
 */
export function toastError(message) {
    if (!silentToasts) toast.error(message);
    return false;
}

/**
 * Inserts the item into and sorts the array in place, based on the orderArray
 * @template T
 * @param {T} item
 * @param {T[]} array
 * @param {T[]} orderArray
 * @returns {T[]} The reference to the original array
 */
export function insertAndSortByOrder(item, array, orderArray) {
    if (!orderArray || !orderArray.includes(item)) {
        console.error(`Item ${item} is not in the order array`);
        return array;
    }
    array.push(item);
    return array.sort((a, b) => orderArray.indexOf(a) - orderArray.indexOf(b));
}

export function compareAlphaIgnoreCase(a, b) {
    return a.localeCompare(b, undefined, { sensitivity: "base" });
}

export function compareGameTitles(a, b) {
    const titleA = a.sortingTitle || a.title;
    const titleB = b.sortingTitle || b.title;
    return compareAlphaIgnoreCase(titleA, titleB);
}

export function loadFromStorage(key, fallback) {
    try {
        const item = localStorage.getItem(key);
        return item !== null ? JSON.parse(item) : fallback;
    } catch {
        return fallback;
    }
}

export function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value, null, 4));
}
