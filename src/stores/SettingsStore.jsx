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
    AND: "Game has all",
    OR: "Game has at least one",
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

const storedSettings = JSON.parse(localStorage.getItem(settingsKeyInStorage));
const settingsStore = new SettingsStore(storedSettings);
autorun(() => saveToStorage(settingsKeyInStorage, settingsStore)); // whenever settings are changed, auto-save

const SettingsStoreContext = createContext(settingsStore);
export const useSettingsStore = () => useContext(SettingsStoreContext);
// Prefer to use the context version in components, for expanded functionality in the future
// but the global version is available for non-component uses
export const globalSettingsStore = settingsStore;
