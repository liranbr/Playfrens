import { tagTypes } from "@/models";
import { settingsStorageKey } from "@/stores";

// Short alias for convenience, used a lot throughout the DataStore modules
export const tT = tagTypes;

export const defaultFiltersStorageKey = "defaultFilters";

export const storageKeys = {
    [tT.friend]: "allFriends",
    [tT.category]: "allCategories",
    [tT.status]: "allStatuses",
    games: "allGames",
    reminders: "allReminders",
    settings: settingsStorageKey,
    defaultFilters: defaultFiltersStorageKey,
    version: "version",
    visited: "visited",
    tagsCustomOrders: "tagsCustomOrders",
};

export const storageKeyToTagType = {
    [storageKeys[tT.friend]]: tT.friend,
    [storageKeys[tT.category]]: tT.category,
    [storageKeys[tT.status]]: tT.status,
};

export function preImportList() {
    return { toAdd: [], toUpdate: { old: [], latest: [] }, toSkip: [] };
}

export function defaultTagsSample() {
    return {
        [tT.friend]: [],
        [tT.category]: ["Playthrough", "Round-based", "Persistent World"],
        [tT.status]: [
            "Playing",
            "Play Anytime",
            "LFG",
            "Paused",
            "Backlog",
            "Abandoned",
            "Finished",
        ],
    };
}

