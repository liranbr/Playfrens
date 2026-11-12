// Settings saved per account ([users|guests].settings).
export const ACCOUNT_SETTINGS_KEYS = [
    "fontSize",
    "reduceMotion",
    "tagHoverGameHighlight",
    "tagGameCounterDisplay",
    "friendIconDisplay",
    "toggleCompactGameGrid",
    "gamesGridCardWidth",
    "toggleHideGameStoreButtons",
    "hideMatureContent",
];

/** Returns true if the value is string, boolean or number. */
const isValidValue = (value) => {
    return (
        typeof value === "string" ||
        typeof value === "boolean" ||
        (typeof value === "number" && Number.isFinite(value))
    );
};

// Keeps only known account keys with primitive values, returns null if the input isn't an object.
export function pickAccountSettings(settings) {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
    const picked = {};
    for (const key of ACCOUNT_SETTINGS_KEYS) {
        const value = settings[key];
        if (isValidValue(value)) picked[key] = value;
    }
    return picked;
}

