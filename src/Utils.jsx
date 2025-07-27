import { Bounce, toast } from "react-toastify";

const toastOptions = {
    position: "bottom-center",
    autoClose: 3000,
    closeButton: false,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    pauseOnFocusLoss: false,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce,
};

let silentToasts = false;

export function setToastSilence(silence) {
    silentToasts = silence;
}

export function toastError(message) {
    if (!silentToasts) toast.error(message, toastOptions);
}

export function toastDataChangeSuccess(message) {
    // game data changes don't cause a game grid filter update, this triggers it
    if (!silentToasts) toast.success(message, toastOptions);
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
