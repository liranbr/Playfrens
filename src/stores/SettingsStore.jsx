import { createContext, useContext } from "react";
import { autorun, makeAutoObservable } from "mobx";
import { saveToStorage } from "../Utils.jsx";

const nameInStorage = "Settings";
const TagHoverGameHighlightOptions = ["highlight", "darken", "none"];

class SettingsStore {
    // Default values, overridden by settings loaded from storage
    TagHoverGameHighlight = "highlight";

    constructor(settings = {}) {
        makeAutoObservable(this);
        Object.assign(this, settings);
    }
}

const storedSettings = JSON.parse(localStorage.getItem(nameInStorage));
const settingsStore = new SettingsStore(storedSettings);
autorun(() => saveToStorage(nameInStorage, settingsStore)); // whenever settings are changed, auto-save

const SettingsStoreContext = createContext(settingsStore);
export const useSettingsStore = () => useContext(SettingsStoreContext);
