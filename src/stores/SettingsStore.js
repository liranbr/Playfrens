import { createContext, useContext } from "react";
import { autorun, comparer, makeAutoObservable, toJS } from "mobx";

import { UserSettings } from "./Settings/UserSettings.js";
import { BoardSettings } from "./Settings/BoardSettings.js";

/**
 * @typedef {"toggle" | "dropdown" | "radio" | "slider"} settingType - Type of the setting.
 */

/**
 * @typedef {Object} Range
 * @property {number} min - Minimum value of this range.
 * @property {number} max - Maximum value of this range.
 * @property {number?} step - Default is 1, steps the current value by the step amount between min and max range.
 */

/** @typedef {{ [key: string]: string }} OptionList */

/**
 * @typedef SettingObject - Object setting holding all relevant rules of that setting.
 * @property {number | string | boolean | Object<string, string>} [value] - Current value, filled from default by the SettingsStore. An object when keyed by tag type.
 * @property {number | string | boolean | Object<string, string>} default - Default value.
 * @property {string} title - Title of the setting.
 * @property {string} description - Description of the setting.
 * @property {string} [info] - Shown in an InfoIcon next to the title.
 * @property {settingType} settingType - Type of the setting.
 * @property {Range?} range - If {@link settingType} is set to "slider".
 * @property {string} [unit] - Suffix of the slider's displayed value.
 * @property {OptionList?} options - If {@link settingType} is set to "dropdown" and "radio".
 */

export const settingsStorageKey = "settings";

const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const clone = (value) => structuredClone(toJS(value));
const isKeyedByTagType = (setting) => typeof setting.default === "object";
const toValues = (group) =>
    Object.fromEntries(Object.entries(group).map(([key, setting]) => [key, toJS(setting.value)]));

/** Returns the value normalized for the setting's type, or undefined if it's invalid. */
function validate(setting, value) {
    switch (setting.settingType) {
        case "toggle":
            return typeof value === "boolean" ? value : undefined;
        case "dropdown":
        case "radio":
            return Object.hasOwn(setting.options, value) ? value : undefined;
        case "slider": {
            const number = Number(value);
            if (!Number.isFinite(number)) return undefined;
            const { min, max } = setting.range;
            return Math.min(max, Math.max(min, number));
        }
    }
}

class SettingsStore {
    /** Settings on the user level. */
    user = new UserSettings();
    /** Settings on the board level. */
    board = new BoardSettings();

    constructor() {
        for (const group of [this.user, this.board]) {
            for (const setting of Object.values(group)) setting.value = clone(setting.default);
            makeAutoObservable(group);
        }
        makeAutoObservable(this, { user: false, board: false });
        // Everything sized in rem scales with this
        autorun(() => {
            document.documentElement.style.fontSize = `${this.user.fontSize.value}%`;
            document.documentElement.dataset.reduceMotion = this.user.reduceMotion.value; // see index.css
        });
    }

    /** Verify the about to be set setting's value. Pass subKey for settings keyed by the tag type. */
    set(setting, value, subKey) {
        const valid = validate(setting, value);
        if (valid === undefined) return console.warn(`Invalid "${setting.title}" value: ${value}`);

        if (subKey === undefined) setting.value = valid;
        else setting.value[subKey] = valid;
    }

    reset(setting) {
        setting.value = clone(setting.default);
    }

    isDefault(setting) {
        return comparer.structural(setting.value, setting.default);
    }

    populateUserSettings(values) {
        this.#populate(this.user, values);
    }

    populateBoardSettings(values) {
        this.#populate(this.board, values);
    }

    /** Flat { key: value } object */
    get userValues() {
        return toValues(this.user);
    }

    /** Flat { key: value } object */
    get boardValues() {
        return toValues(this.board);
    }

    /** Checks if there's Motion Reduction enabled, use this call when CSS motion is handled inside JS */
    isMotionReduced() {
        const { value } = this.user.reduceMotion;
        if (value === "system") return reducedMotionQuery.matches;
        return value === "on";
    }

    // Only reads the group's own keys, so stale keys in saved data are ignored
    #populate(group, values) {
        if (!values || typeof values !== "object") return;
        for (const [key, setting] of Object.entries(group)) {
            const value = values[key];
            if (value === undefined) continue;
            if (!isKeyedByTagType(setting)) this.set(setting, value);
            else if (value && typeof value === "object") {
                for (const subKey of Object.keys(setting.default))
                    if (value[subKey] !== undefined) this.set(setting, value[subKey], subKey);
            }
        }
    }
}

const settingsStore = new SettingsStore(); // After creation, settings are populated by userStore and the active board
// Prefer to use the context version in components, for expanded functionality in the future
// but the global version is available for non-component uses
const SettingsStoreContext = createContext(settingsStore);
export const useSettingsStore = () => useContext(SettingsStoreContext);
export const globalSettingsStore = settingsStore;
