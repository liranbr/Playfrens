import { createContext, useContext } from "react";
import { autorun, makeAutoObservable } from "mobx";
import { saveToStorage } from "@/Utils.jsx";
import { tagTypes } from "@/models";

export const settingsStorageKey = "settings";

export const TagHoverGameHighlightOptions = {
    highlight: "Highlight",
    darken: "Darken the rest",
    none: "None",
};
export const TagFilterLogicOptions = {
    AND: "Have all",
    OR: "Have at least one",
};
export const TagSortOptions = {
    name: "Name",
    count: "Game Count",
    custom: "Custom Order",
};
export const GameSortOptions = {
    title: "Title",
    custom: "Custom Order",
};
export const SortDirectionOptions = {
    asc: "Ascending",
    desc: "Descending",
};

class SettingsStore {
    // Default values, overridden by settings loaded from storage
    tagHoverGameHighlight = "darken";
    tagFilterLogic = {
        [tagTypes.friend]: "AND",
        [tagTypes.category]: "OR",
        [tagTypes.status]: "OR",
    };
    tagSortMethods = {
        [tagTypes.friend]: "name",
        [tagTypes.category]: "custom",
        [tagTypes.status]: "custom",
    };
    tagSortDirection = {
        [tagTypes.friend]: "asc",
        [tagTypes.category]: "asc",
        [tagTypes.status]: "asc",
    };
    gameSortMethod = "title";
    gameSortDescending = "asc";

    constructor(settings = {}) {
        makeAutoObservable(this);
        Object.assign(this, settings);
    }

    setTagHoverGameHighlight(option) {
        if (TagHoverGameHighlightOptions[option]) this.tagHoverGameHighlight = option;
        else console.warn(`Invalid TagHoverGameHighlight option: ${option}`);
    }

    setTagFilterLogic(tagType, option) {
        if (TagFilterLogicOptions[option]) this.tagFilterLogic[tagType] = option;
        else console.warn(`Invalid TagFilterLogic option for ${tagType}: ${option}`);
    }

    setTagSort(tagType, option) {
        if (TagSortOptions[option]) this.tagSortMethods[tagType] = option;
        else console.warn(`Invalid TagSortMethod option for ${tagType}: ${option}`);
    }

    setTagSortDirection(tagType, option) {
        if (SortDirectionOptions[option]) this.tagSortDirection[tagType] = option;
        else console.warn(`Invalid TagSortDirection option for ${tagType}: ${option}`);
    }
}

const storedSettings = JSON.parse(localStorage.getItem(settingsStorageKey));
const settingsStore = new SettingsStore(storedSettings);
// whenever settings are changed, auto-save
autorun(() => saveToStorage(settingsStorageKey, settingsStore));
// Prefer to use the context version in components, for expanded functionality in the future
// but the global version is available for non-component uses
const SettingsStoreContext = createContext(settingsStore);
export const useSettingsStore = () => useContext(SettingsStoreContext);
export const globalSettingsStore = settingsStore;
