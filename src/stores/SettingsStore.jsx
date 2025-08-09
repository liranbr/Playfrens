import { createContext, useContext } from "react";
import { autorun, makeAutoObservable } from "mobx";
import { saveToStorage } from "@/Utils.jsx";
import { tagTypes } from "@/models";

export const settingsKeyInStorage = "settings";

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
    nameAsc: "Name (A-Z)",
    nameDesc: "Name (Z-A)",
    countAsc: "Game Count (Low to High)",
    countDesc: "Game Count (High to Low)",
    // custom: "Custom Order",
};

class SettingsStore {
    // Default values, overridden by settings loaded from storage
    tagHoverGameHighlight = "darken";
    tagFilterLogic = {
        [tagTypes.friend.key]: "AND",
        [tagTypes.category.key]: "OR",
        [tagTypes.status.key]: "OR",
    };
    tagSort = {
        [tagTypes.friend.key]: "nameAsc",
        [tagTypes.category.key]: "nameDesc", // TODO: implement custom order
        [tagTypes.status.key]: "countDesc", // TODO: implement custom order
    };
    // when sorting tags by game count, whether to use filtered games (true) or all games (false)
    tagSortGameCountWithFilters = false;

    constructor(settings = {}) {
        makeAutoObservable(this);
        Object.assign(this, settings);
    }

    setTagHoverGameHighlight(value) {
        if (TagHoverGameHighlightOptions[value]) {
            this.tagHoverGameHighlight = value;
        } else {
            console.warn(`Invalid TagHoverGameHighlight value: ${value}`);
        }
    }

    setTagFilterLogic(tagType, value) {
        if (TagFilterLogicOptions[value]) {
            this.tagFilterLogic[tagType.key] = value;
        } else {
            console.warn(`Invalid TagFilterLogic value for ${tagType.key}: ${value}`);
        }
    }

    setTagSort(tagType, value) {
        if (TagSortOptions[value]) {
            this.tagSort[tagType.key] = value;
        } else {
            console.warn(`Invalid TagSort value for ${tagType.key}: ${value}`);
        }
    }

    setTagSortGameCountWithFilters(value) {
        if (typeof value !== "boolean") {
            console.warn(`Invalid value for tagSortGameCountWithFilters: ${value}`);
            return;
        }
        this.tagSortGameCountWithFilters = value;
    }
}

const storedSettings = JSON.parse(localStorage.getItem(settingsKeyInStorage));
const settingsStore = new SettingsStore(storedSettings);
autorun(() => saveToStorage(settingsKeyInStorage, settingsStore)); // whenever settings are changed, auto-save

const SettingsStoreContext = createContext(settingsStore);
export const useSettingsStore = () => useContext(SettingsStoreContext);
// Prefer to use the context version in components, for expanded functionality in the future
// but the global version is available for non-component uses
export const globalSettingsStore = settingsStore;
