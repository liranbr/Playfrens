import { useRef } from "react";
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

export function compareAlphaIgnoreCase(a, b) {
    return a.localeCompare(b, undefined, { sensitivity: "base" });
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

export function deleteItemFromArray(arr, item) {
    const index = arr.indexOf(item);
    if (index > -1) arr.splice(index, 1);
}

export function useDebouncedCallback(callback, delay) {
    const timeoutRef = useRef();
    return (...args) => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}
export function moveItemInArray(arr, fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex >= arr.length)
        throw new Error("Index out of bounds");

    const [element] = arr.splice(fromIndex, 1); // remove element
    if (fromIndex < toIndex) toIndex--; // adjusts to avoid the index shifting, to always end up in the same direction
    arr.splice(toIndex, 0, element); // insert at new position
    return arr;
}

// CSS defined durations converted into milliseconds
export function parseDuration(str) {
    str = str.trim();
    if (str.endsWith("ms")) return parseFloat(str);
    if (str.endsWith("s")) return parseFloat(str) * 1000;
    return 0;
}