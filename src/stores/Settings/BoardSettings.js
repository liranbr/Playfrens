import { tagTypes } from "@/models";

/** @typedef {import("../SettingsStore.js").SettingObject} SettingObject */

/** Saved with the board. Object defaults hold one value per tag type. */
class BoardSettings {
    /** @type {SettingObject} */
    tagFilterLogic = {
        default: {
            [tagTypes.friend]: "AND",
            [tagTypes.category]: "OR",
            [tagTypes.status]: "OR",
        },
        title: "Tag Filter Logic",
        description: "Selecting multiple tags will filter for games that",
        settingType: "radio",
        options: {
            AND: "Have all",
            OR: "Have at least one",
        },
    };

    /** @type {SettingObject} */
    tagSortMethods = {
        default: {
            [tagTypes.friend]: "name",
            [tagTypes.category]: "custom",
            [tagTypes.status]: "custom",
        },
        title: "Tag Sort Method",
        description: "Sort tags in the sidebar by",
        settingType: "dropdown",
        options: {
            name: "Name",
            countFiltered: "Game Count (Filtered)",
            countTotal: "Game Count (Total)",
            custom: "Custom (drag to rearrange)",
        },
    };

    /** @type {SettingObject} */
    tagSortDirection = {
        default: {
            [tagTypes.friend]: "asc",
            [tagTypes.category]: "asc",
            [tagTypes.status]: "asc",
        },
        title: "Tag Sort Direction",
        description: "Direction of the sidebar tag sorting",
        settingType: "radio",
        options: {
            asc: "Ascending",
            desc: "Descending",
        },
    };

    /** @type {SettingObject} */
    gameSortMethod = {
        default: "title",
        title: "Game Sort Method",
        description: "Sort games in the grid by",
        settingType: "dropdown",
        options: {
            title: "Title",
        },
    };

    /** @type {SettingObject} */
    gameSortDirection = {
        default: "asc",
        title: "Game Sort Direction",
        description: "Direction of the games grid sorting",
        settingType: "radio",
        options: {
            asc: "Ascending",
            desc: "Descending",
        },
    };

    /** @type {SettingObject} */
    toggleShowMatureContent = {
        default: false,
        title: "Show Explicit Content",
        description: "Include explicit/adult-only games when adding games",
        info: "Only affects games whose main content is explicit sexual material. Games with general mature themes, violence, or occasional nudity aren't hidden by this.",
        settingType: "toggle",
    };
}

export { BoardSettings };
