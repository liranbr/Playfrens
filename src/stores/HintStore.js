import { makeAutoObservable } from "mobx";
import { loadFromStorage, saveToStorage } from "@/Utils";

export const hintsStorageKey = "dismissed-hints";

// Starts empty, each dismissed hint adds its own key: { dismissed, description }
class HintStore {
    dismissed = loadFromStorage(hintsStorageKey, {});

    constructor() {
        makeAutoObservable(this);
        saveToStorage(hintsStorageKey, this.dismissed);
    }

    isDismissed(key) {
        return this.dismissed[key]?.dismissed === true;
    }

    dismiss(key, description, dismissed = true) {
        this.dismissed[key] = { dismissed, description };
        saveToStorage(hintsStorageKey, this.dismissed);
    }
}

export const globalHintStore = new HintStore();
