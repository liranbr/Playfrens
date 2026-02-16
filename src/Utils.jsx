import { useRef, useState } from "react";
import { toast } from "react-toastify";

let silentToasts = false;

export function setToastSilence(silence) {
    silentToasts = silence;
}

/**
 * @param {string} message
 * @returns {true}
 */
export async function toastSuccess(message) {
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

let timesSaved = 0;

// THIS IS REALLY BAD, BUT THIS IS FOR DEVELOPMENT REASONS FOR NOW, SEE BELOW
// TODO: REMOVE THIS HACK AND MAKE A PROPER SOLUTION FOR AUTO-SAVING TO THE BACKEND
let allowDBSave = false;
export function DELETEME_AllowDBSave() {
    allowDBSave = true;
}

export async function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value, null, 4));
    // THIS IS REALLY BAD, BUT THIS IS FOR DEVELOPMENT REASONS FOR NOW
    // A WISE MAN ONCE SAID "CLEAN CODE, I NEED. SPAGHETTI I MUST."
    if (!allowDBSave) return;
    const { ExportDataStoreToJSON } = await import("./stores/DataStore");
    const { saveBoard } = await import("./APIUtils");
    const data = ExportDataStoreToJSON();
    data[key] = value;
    await saveBoard(data);
    console.warn("Auto-saved board to backend through reactions. Needs improvement.", ++timesSaved);
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
    if (fromIndex < 0 || fromIndex >= arr.length || toIndex < 0 || toIndex > arr.length)
        throw new Error("Index out of bounds");

    const [element] = arr.splice(fromIndex, 1); // remove element
    if (fromIndex < toIndex) toIndex--; // adjusts to avoid the index shifting, to always end up in the same direction
    if (toIndex === arr.length) arr.push(element);
    else arr.splice(toIndex, 0, element); // insert at new position
    return arr;
}

// CSS defined durations converted into milliseconds
export function parseDuration(str) {
    str = str.trim();
    if (str.endsWith("ms")) return parseFloat(str);
    if (str.endsWith("s")) return parseFloat(str) * 1000;
    return 0;
}

export function ensureUniqueName(namesList, newName) {
    const lowerSet = new Set(namesList.map((name) => name.toLowerCase()));
    const lowerName = newName.toLowerCase();

    if (!lowerSet.has(lowerName)) return newName;

    const nameWithCount = (name, c) => `${name} (${c})`;
    let counter = 1;
    while (lowerSet.has(nameWithCount(lowerName, counter))) counter++;

    return nameWithCount(newName, counter);
}

/**
 * Given an ordered list of image urls, return the first that properly loads
 * @param {string[]} urls - ordered list of image URLs
 * @returns {Promise<string|null>} resolves with the first loadable URL, or null
 */
export async function findFirstValidImage(urls) {
    for (const url of urls) {
        const ok = await tryLoadImage(url);
        if (ok) return url;
    }
    return null;
}

export function tryLoadImage(url) {
    if (url.includes(".webm")) return tryLoadVideo(url);
    return new Promise((resolve) => {
        const img = new Image();
        function cleanAndResolve(result) {
            img.onload = null;
            img.onerror = null;
            img.removeAttribute("src");
            resolve(result);
        }
        img.onload = () => cleanAndResolve(true);
        img.onerror = () => cleanAndResolve(false);
        img.src = url;
    });
}

function tryLoadVideo(url) {
    return new Promise((resolve) => {
        const vid = document.createElement("video");
        vid.preload = "metadata";
        vid.muted = true;
        vid.playsInline = true;

        const cleanAndResolve = (status) => {
            vid.onloadeddata = null;
            vid.onerror = null;
            vid.removeAttribute("src");
            vid.load();
            resolve(status);
        };
        vid.onloadeddata = () => cleanAndResolve(true);
        vid.onerror = () => cleanAndResolve(false);

        vid.src = url;
    });
}

// Find a game's full cover URL from its thumbnail URL (educated guesses)
export async function thumbToCover(thumbURL) {
    console.log("Converting thumbnail URL to cover image URL");
    if (!thumbURL) return thumbURL;
    const sources = [];
    if (thumbURL.includes("cdn2.steamgriddb.com/thumb/")) {
        const gridSrc = thumbURL.replace("/thumb/", "/grid/");
        sources.push(gridSrc); // extension stays as is
        sources.push(gridSrc.replace(".jpg", ".png"));
        sources.push(gridSrc.replace(".jpg", ".webp"));
        sources.push(gridSrc.replace(".webm", ".webp"));
        sources.push(gridSrc.replace(".webm", ".png"));
    }
    if (
        thumbURL.startsWith("https://shared.steamstatic.com/store_item_assets/steam/apps/") &&
        (thumbURL.includes("library_capsule.jpg") || thumbURL.includes("library_600x900.jpg"))
    ) {
        sources.push(thumbURL.replace(".jpg", "_2x.jpg"));
    }
    const coverURL = await findFirstValidImage(sources);
    return coverURL ?? thumbURL;
}

// Find a game's thumbnail URL from its cover URL (educated guesses)
export async function coverToThumb(coverURL) {
    console.log("Converting cover image URL to thumbnail URL");
    if (!coverURL) return coverURL;
    const sources = [];
    if (coverURL.includes("cdn2.steamgriddb.com/grid/")) {
        const thumbSrc = coverURL.replace("/grid/", "/thumb/");
        sources.push(thumbSrc.replace(".png", ".jpg"));
        sources.push(thumbSrc); // extension stays as is
        sources.push(thumbSrc.replace(".webp", ".jpg"));
        sources.push(thumbSrc.replace(".webp", ".webm"));
        sources.push(thumbSrc.replace(".png", ".webm"));
    }
    if (
        coverURL.startsWith("https://shared.steamstatic.com/store_item_assets/steam/apps/") &&
        (coverURL.includes("library_capsule_2x.jpg") || coverURL.includes("library_600x900_2x.jpg"))
    ) {
        sources.push(coverURL.replace("_2x.jpg", ".jpg"));
    }
    const thumbURL = await findFirstValidImage(sources);
    return thumbURL ?? coverURL;
}
