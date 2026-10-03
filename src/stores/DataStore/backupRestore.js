import { action } from "mobx";
import { userStore } from "@/stores";
import { saveBoard } from "@/APIUtils.js";
import { loadFromStorage, saveToStorage, toastError } from "@/Utils";
import { version } from "/package.json";
import { populateGames } from "./gameOperations.js";
import { populateReminders } from "./reminderOperations.js";
import {
    populateTags,
    populateTagsCustomOrders,
    populateTagsFromTagNames,
} from "./tagOperations.js";
import { defaultTagsSample, storageKeys, tT } from "./constants.js";

/** @param {import("../DataStore.js").DataStore} store */
export function ExportDataStoreToJSON(store) {
    return {
        [storageKeys[tT.friend]]: store.allTags[tT.friend], // turning maps into arrays to stringify
        [storageKeys[tT.category]]: store.allTags[tT.category],
        [storageKeys[tT.status]]: store.allTags[tT.status],
        [storageKeys.games]: store.allGames,
        [storageKeys.reminders]: store.allReminders,
        [storageKeys.settings]: loadFromStorage(storageKeys.settings, {}),
        [storageKeys.defaultFilters]: loadFromStorage(storageKeys.defaultFilters, {}),
        [storageKeys.version]: version,
        [storageKeys.tagsCustomOrders]: store.tagsCustomOrders,
    };
}

export function backupToFile(store) {
    console.log("Backing up data to file...");
    const data = ExportDataStoreToJSON(store);
    const { userInfo } = userStore;

    const blob = new Blob([JSON.stringify(data, null, 4)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date().toISOString().split(".")[0].replace("T", " ").replaceAll(":", "-");
    a.href = url;
    a.download = ["Playfrens", userInfo.displayName, timestamp].filter(Boolean).join(" ") + ".json";
    a.click();
    URL.revokeObjectURL(url);
}

export function restoreFromFile(store, file) {
    console.log("Restoring data from file...");
    const reader = new FileReader();
    reader.onload = action(async function (e) {
        const data = JSON.parse(e.target.result.toString());
        // Populate the DataStore's Tags and Games. They're then localstorage-synced by the reactions.
        const tagCollection = {
            [tT.friend]: data[storageKeys[tT.friend]],
            [tT.category]: data[storageKeys[tT.category]],
            [tT.status]: data[storageKeys[tT.status]],
        };
        populateTags(store, tagCollection);
        await populateGames(store, data[storageKeys.games], data[storageKeys.version]);
        populateReminders(store, data[storageKeys.reminders]);
        populateTagsCustomOrders(store, data[storageKeys.tagsCustomOrders]);
        // Load the settings to localstorage, and reload, which also populates the SettingsStore
        saveToStorage(storageKeys.settings, data[storageKeys.settings]);
        saveToStorage(storageKeys.defaultFilters, data[storageKeys.defaultFilters]);

        saveBoard(store.activeBoardId, ExportDataStoreToJSON(store))
            .then(() => {
                window.location.reload();
            })
            .catch((error) => {
                toastError("Failed to save data to server: " + error.message);
            });
    });
    reader.readAsText(file);
}

/** Seeds the first-ever visit with a starting set of tags, before any board has loaded. */
export function seedFirstVisitDefaults(store) {
    const firstVisit = loadFromStorage(storageKeys.visited, false) === false;
    if (firstVisit && store.allGames.size === 0) {
        populateTagsFromTagNames(store, defaultTagsSample());
        saveToStorage(storageKeys.visited, true);
    }
    saveToStorage(storageKeys.version, version);
}

