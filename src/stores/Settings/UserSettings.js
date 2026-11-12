/** @typedef {import("../SettingsStore.js").SettingObject} SettingObject */

/** @typedef {import("#shared/accountSettings.js").ACCOUNT_SETTINGS_KEYS} ACCOUNT_SETTINGS_KEYS */
/** Saved per account. Keys must match {@link ACCOUNT_SETTINGS_KEYS} */
class UserSettings {
    /** @type {SettingObject} */
    tagHoverGameHighlight = {
        default: "darken",
        title: "Tag Hover Highlight",
        description: "Highlight games when hovering on a sidebar tag",
        settingType: "dropdown",
        options: {
            darken: "Darken games without",
            highlight: "Highlight games with",
            none: "None",
        },
    };

    /** @type {SettingObject} */
    tagGameCounterDisplay = {
        default: "countFiltered",
        title: "Game Count Badge",
        description: "Show a Game Counter next to each Tag in the Sidebar",
        settingType: "dropdown",
        options: {
            countFiltered: "Game Count (of filtered)",
            countTotal: "Game Count (of total)",
            none: "None",
        },
    };

    /** @type {SettingObject} */
    friendIconDisplay = {
        default: "hideMissing",
        title: "Friend Icons",
        description: "Show friend avatars in the Friends sidebar and a game's tag list",
        settingType: "dropdown",
        options: {
            hideMissing: "Hide Missing",
            hide: "Hide All",
            showAll: "Show All",
        },
    };

    /** @type {SettingObject} */
    gamesGridCardWidth = {
        default: 210,
        title: "Game Card Size",
        description: "Width of game cards in the grid, more or fewer fit per row automatically",
        settingType: "slider",
        range: { min: 140, max: 320, step: 10 },
        unit: "px",
    };

    /** @type {SettingObject} */
    toggleCompactGameGrid = {
        default: false,
        title: "Compact Grid Spacing",
        description: "Make the games grid's padding and gaps smaller",
        settingType: "toggle",
    };

    /** @type {SettingObject} */
    toggleHideGameStoreButtons = {
        default: false,
        title: "Obscure Game Platform Actions",
        description:
            "In a Game Page, hide the 'Play' and 'Store Page' buttons unless cover art is hovered on",
        settingType: "toggle",
    };

    toggleMatureContent = {
        default: false,
        title: "Show Mature Content",
        description: "Make games that are marked as Adult content visible instead of being blured.",
        settingType: "toggle",
    };

    /** @type {SettingObject} */
    fontSize = {
        default: 100,
        title: "Font Size",
        description: "Scales text and spacing across the whole app",
        settingType: "slider",
        range: { min: 75, max: 125, step: 5 },
        unit: "%", // in % of the browser default
    };

    /** @type {SettingObject} */
    reduceMotion = {
        default: "system",
        title: "Reduce Motion",
        description: "Turns off animations and transitions",
        settingType: "dropdown",
        options: {
            system: "Match System",
            on: "On",
            off: "Off",
        },
    };
}

export { UserSettings };
