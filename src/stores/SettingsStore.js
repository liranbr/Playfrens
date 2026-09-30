import { createContext, useContext } from "react";
import { autorun, makeAutoObservable } from "mobx";
import { tagTypes } from "@/models";
import { ACCOUNT_SETTINGS_KEYS, pickAccountSettings } from "#shared/accountSettings.js";

export const settingsStorageKey = "settings";

export const TagHoverGameHighlightOptions = {
    darken: "Darken the rest",
    highlight: "Highlight",
    none: "None",
};
export const TagFilterLogicOptions = {
    AND: "Have all",
    OR: "Have at least one",
};
export const TagSortOptions = {
    name: "Name",
    countFiltered: "Game Count (Filtered)",
    countTotal: "Game Count (Total)",
    custom: "Custom (drag to rearrange)",
};
export const GameSortOptions = {
    title: "Title",
};
export const SortDirectionOptions = {
    asc: "Ascending",
    desc: "Descending",
};
export const TagGameCounterOptions = {
    countFiltered: "Game Count (with current filters)",
    countTotal: "Game Count (total)",
    none: "None",
};
export const HideGameStoreButtonsOptions = {
    off: "Off",
    on: "On",
};
export const ShowMatureContentOptions = {
    off: "Off",
    on: "On",
};
export const FriendIconDisplayOptions = {
    hideMissing: "Hide Missing",
    hide: "Hide All",
    showAll: "Show All",
};
export const GamesGridDensityOptions = {
    simple: "Simple",
    compact: "Compact",
};
export const ReduceMotionOptions = {
    system: "Match System",
    on: "On",
    off: "Off",
};
export const GamesGridCardWidthRange = { min: 140, max: 320, step: 10 };
export const FontSizeRange = { min: 75, max: 125, step: 5 }; // in % of the browser default

export const SettingsDefaults = {
    fontSize: 100,
    reduceMotion: "system",
    tagHoverGameHighlight: "darken",
    tagGameCounterDisplay: "countFiltered",
    friendIconDisplay: "hideMissing",
    gamesGridDensity: "simple",
    gamesGridCardWidth: 210,
    hideGameStoreButtons: "on",
    showMatureContent: "off",
};

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

class SettingsStore {
    // Default values, overridden by settings loaded from storage
    fontSize = SettingsDefaults.fontSize;
    reduceMotion = SettingsDefaults.reduceMotion;
    tagHoverGameHighlight = SettingsDefaults.tagHoverGameHighlight;
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
    gameSortDirection = "asc";
    tagGameCounterDisplay = SettingsDefaults.tagGameCounterDisplay;
    hideGameStoreButtons = SettingsDefaults.hideGameStoreButtons;
    showMatureContent = SettingsDefaults.showMatureContent;
    friendIconDisplay = SettingsDefaults.friendIconDisplay;
    gamesGridDensity = SettingsDefaults.gamesGridDensity; // spacing between game cards
    gamesGridCardWidth = SettingsDefaults.gamesGridCardWidth; // in px

    constructor() {
        makeAutoObservable(this);
        // Everything sized in rem scales with this
        autorun(() => {
            document.documentElement.style.fontSize = `${this.fontSize}%`;
            document.documentElement.dataset.reduceMotion = this.reduceMotion; // see index.css
        });
    }

    populate(settings = {}) {
        Object.assign(this, settings);
    }

    populateAccountSettings(settings) {
        this.populate(pickAccountSettings(settings) ?? {});
    }

    // Board data may still hold account keys from before they moved to the account
    populateBoardSettings(settings = {}) {
        const boardOnly = { ...settings };
        for (const key of ACCOUNT_SETTINGS_KEYS) delete boardOnly[key];
        this.populate(boardOnly);
    }

    get accountSettings() {
        return Object.fromEntries(ACCOUNT_SETTINGS_KEYS.map((key) => [key, this[key]]));
    }

    get boardSettings() {
        const settings = JSON.parse(JSON.stringify(this));
        for (const key of ACCOUNT_SETTINGS_KEYS) delete settings[key];
        return settings;
    }

    /** Checks if there's Motion Reduction enabled, use this call when CSS motion is handled inside JS */
    isMotionReduced() {
        if (this.reduceMotion === "system") return reducedMotionQuery.matches;
        return this.reduceMotion === "on";
    }

    setReduceMotion(option) {
        if (ReduceMotionOptions[option]) this.reduceMotion = option;
        else console.warn(`Invalid ReduceMotion option: ${option}`);
    }

    setFontSize(percent) {
        const { min, max } = FontSizeRange;
        this.fontSize = Math.min(max, Math.max(min, Number(percent)));
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

    setTagGameCounterDisplay(option) {
        if (TagGameCounterOptions[option]) this.tagGameCounterDisplay = option;
        else console.warn(`Invalid TagGameCounterDisplay option: ${option}`);
    }

    setHideGameStoreButtons(option) {
        if (HideGameStoreButtonsOptions[option]) this.hideGameStoreButtons = option;
        else console.warn(`Invalid HideGameStoreButtons option: ${option}`);
    }

    setShowMatureContent(option) {
        if (ShowMatureContentOptions[option]) this.showMatureContent = option;
        else console.warn(`Invalid ShowMatureContent option: ${option}`);
    }

    setFriendIconDisplay(option) {
        if (FriendIconDisplayOptions[option]) this.friendIconDisplay = option;
        else console.warn(`Invalid FriendIconDisplay option: ${option}`);
    }

    setGamesGridDensity(option) {
        if (GamesGridDensityOptions[option]) this.gamesGridDensity = option;
        else console.warn(`Invalid GamesGridDensity option: ${option}`);
    }

    setGamesGridCardWidth(width) {
        const { min, max } = GamesGridCardWidthRange;
        this.gamesGridCardWidth = Math.min(max, Math.max(min, Number(width)));
    }
}

const settingsStore = new SettingsStore(); // After creation, settings are populated by userStore from the board
// Prefer to use the context version in components, for expanded functionality in the future
// but the global version is available for non-component uses
const SettingsStoreContext = createContext(settingsStore);
export const useSettingsStore = () => useContext(SettingsStoreContext);
export const globalSettingsStore = settingsStore;
