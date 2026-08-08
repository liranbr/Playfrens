import { useRef } from "react";
import { toast } from "react-toastify";

let silentToasts = false;

export function setToastSilence(silence) {
    silentToasts = silence;
}

/**
 * @param {string} message
 * @param {string} consoleMessage
 * @returns {true}
 */
export async function toastSuccess(message, consoleMessage = "") {
    if (!silentToasts) {
        toast.success(message);
        if (consoleMessage) console.log(consoleMessage);
    }
    return true;
}

/**
 * @param {string} message
 * @returns {true}
 */
export async function toastInfo(message) {
    if (!silentToasts) toast.info(message);
    return true;
}

/**
 * @param {string} message
 * @returns {false}
 */
export function toastError(message, consoleMessage = "") {
    if (!silentToasts) {
        toast.error(message);
        console.error(message); // reflects toastError on console by default
        if (consoleMessage) console.error(consoleMessage);
    }
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

/**
 * Strips class or JSON-like object, and turns it into a generic object.
 *
 * @param {*} value
 * @returns {*} a plain, detached clone containing just the data
 *
 * @example
 * class Party {
 *     tagIDs = { friend: new Set(["example"]) };
 * }
 * const party = new Party();
 * console.log(party); // Party { tagIDs: [Getter/Setter] }
 * toPlainObject(party); // { tagIDs: { friend: ["example"] } }
 */
export function toPlainObject(value) {
    return JSON.parse(JSON.stringify(value));
}

/**
 * Deep equal that doesn't care about object key order, unlike a JSON.stringify which does care.
 *
 * @param {*} a
 * @param {*} b
 * @returns {boolean} true if a and b are structurally equal
 *
 * @example
 * deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 }); // true (JSON.stringify would say false, different key order)
 * deepEqual({ a: 1 }, { a: 2 }); // false
 */
export function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a))
        return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    return (
        aKeys.length === bKeys.length &&
        aKeys.every((key) => Object.hasOwn(b, key) && deepEqual(a[key], b[key]))
    );
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

// Sets a timeout, which gets refereshed when called again.
export function debounce(timers, key, callback, delay) {
    clearTimeout(timers[key]);
    timers[key] = setTimeout(callback, delay);
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

/**
 * Checks if an object's fields differ from provided values. A key in partial that doesn't exist
 * on obj is ignored - there's nothing to compare it to.
 *
 * @template {object} T
 * @param {T} obj - The object we are checking
 * @param {Partial<T>} partial - a partial object containing Key/value that will be compared with obj
 * @returns {boolean} true if any value is different
 *
 * @example
 * const obj = { icon: "a", type: "b" };
 * const p1 = { icon: "x" };
 * const p2 = { icon: "a" };
 * const p3 = { icon_small: "a" };
 * shouldUpdateObject(obj, p1); // true
 * shouldUpdateObject(obj, p2); // false (matching values)
 * shouldUpdateObject(obj, p3); // false (nothing to compare)
 */
export function shouldUpdateObject(obj, partial = {}) {
    return Object.entries(partial).some(([key, value]) => {
        if (!Object.hasOwn(obj, key)) return false;
        return !deepEqual(obj[key], value);
    });
}

/**
 * Updates an object's fields from a partial object (only if values differ)
 *
 * @template {object} T
 * @param {T} obj - The object to update
 * @param {Partial<T>} partial - Key/value pairs to apply
 * @returns {boolean} true if any value was changed
 */
export function updateObject(obj, partial = {}) {
    let updated = false;

    for (const key of /** @type {Array<keyof T>} */ (Object.keys(partial))) {
        if (!Object.hasOwn(obj, key)) continue;

        const value = partial[key];
        if (!deepEqual(obj[key], value)) {
            obj[key] = value;
            updated = true;
        }
    }

    return updated;
}

export const HttpStatus = Object.freeze({
    // 2xx: Success
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,

    // 4xx: Client Errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    GONE: 410,
    URI_TOO_LONG: 414,
    TOO_MANY_REQUESTS: 429,

    // 5xx: Server Errors
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    SERVICE_UNAVAILABLE: 503,
});
