import { Bounce, toast } from "react-toastify";

const toastOptions = {
    position: "bottom-center",
    autoClose: 3000,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    pauseOnFocusLoss: false,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce
};

export function toastError(message) {
    toast.error(message, toastOptions);
}

export function toastDataChangeSuccess(message) {
    // game data changes don't cause a game grid filter update, this triggers it
    forceFilterUpdate();
    toast.success(message, toastOptions);
}

export function insertSortedByOrder(item, array, orderArray) {
    if (!orderArray || !orderArray.includes(item)) {
        console.error(`Item ${item} is not in the order array`);
        return array;
    }
    array = [...array, item];
    return array.sort((a, b) => orderArray.indexOf(a) - orderArray.indexOf(b));
}


// forceFilterUpdate used to force a filter update in the game grid, e.g. when removing a friend
let forceFilterUpdateCallback = null;

export function setForceFilterUpdateCallback(callback) {
    forceFilterUpdateCallback = callback;
}

export function forceFilterUpdate() {
    if (forceFilterUpdateCallback) {
        forceFilterUpdateCallback();
    } else {
        console.error("No force filter update callback set");
    }
}