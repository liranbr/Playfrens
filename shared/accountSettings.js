// Settings saved per account ([users|guests].settings).
export const ACCOUNT_SETTINGS_KEYS = [
    "fontSize",
    "reduceMotion",
    "tagHoverGameHighlight",
    "tagGameCounterDisplay",
    "friendIconDisplay",
    "gamesGridDensity",
    "gamesGridCardWidth",
    "hideGameStoreButtons",
];

// Keeps only known account keys with primitive values, returns null if the input isn't an object.
export function pickAccountSettings(settings) {
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) return null;
    const picked = {};
    for (const key of ACCOUNT_SETTINGS_KEYS) {
        const value = settings[key];
        if (typeof value === "string" || (typeof value === "number" && Number.isFinite(value)))
            picked[key] = value;
    }
    return picked;
}
