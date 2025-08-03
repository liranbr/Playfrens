import { createContext, useContext } from "react";
import { autorun, makeAutoObservable } from "mobx";
import { saveToStorage } from "../Utils.jsx";

export const settingsKeyInStorage = "settings";
export const TagHoverGameHighlightOptions = {
    highlight: "Highlight",
    darken: "Darken rest",
    none: "Do nothing",
};

class SettingsStore {
    // Default values, overridden by settings loaded from storage
    TagHoverGameHighlight = "darken";

    constructor(settings = {}) {
        makeAutoObservable(this);
        Object.assign(this, settings);
    }

    setTagHoverGameHighlight(value) {
        if (TagHoverGameHighlightOptions[value]) {
            this.TagHoverGameHighlight = value;
        } else {
            console.warn(`Invalid TagHoverGameHighlight value: ${value}`);
        }
    }
}

const storedSettings = JSON.parse(localStorage.getItem(settingsKeyInStorage));
const settingsStore = new SettingsStore(storedSettings);
autorun(() => saveToStorage(settingsKeyInStorage, settingsStore)); // whenever settings are changed, auto-save

const SettingsStoreContext = createContext(settingsStore);
export const useSettingsStore = () => useContext(SettingsStoreContext);
