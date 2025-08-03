import { toast } from "react-toastify";

let silentToasts = false;

export function setToastSilence(silence) {
    silentToasts = silence;
}

export function toastError(message) {
    if (!silentToasts) toast.error(message);
}

export function toastDataChangeSuccess(message) {
    // game data changes don't cause a game grid filter update, this triggers it
    if (!silentToasts) toast.success(message);
}

export function insertSortedByOrder(item, array, orderArray) {
    if (!orderArray || !orderArray.includes(item)) {
        console.error(`Item ${item} is not in the order array`);
        return array;
    }
    array = [...array, item];
    return array.sort((a, b) => orderArray.indexOf(a) - orderArray.indexOf(b));
}

export function compareAlphaIgnoreCase(a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
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
