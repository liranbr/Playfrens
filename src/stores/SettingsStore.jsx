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

class SettingsStore {
    // Default values, overridden by settings loaded from storage
    tagHoverGameHighlight = "darken";
    tagFilterLogic = {
        [tagTypes.friend.key]: "AND",
        [tagTypes.category.key]: "OR",
        [tagTypes.status.key]: "OR",
    };

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
