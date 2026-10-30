import validator from "validator";

// Securtiy check for strings that cleans nad checks the board data before it gets stored
// This is done to avoid bad entries from breaking the board to everyone.
// Each check returns an error message, or null if valid.

const TAG_TYPES = ["friend", "category", "status"];
const TAG_COLLECTIONS = { allFriends: "friend", allCategories: "category", allStatuses: "status" };

// Keys whose text may span multiple lines
const MULTILINE_KEYS = ["note", "message"];
// C1 controls, zero-width space, direction marks/overrides and Byte Order Mark. Joiners stay since emojis need them.
const HIDDEN_CHARS = "\\x80-\\x9F\\u200B\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069\\uFEFF";

const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const isFilled = (v) => typeof v === "string" && !validator.isEmpty(v);
const isOptionalString = (v) => v == null || typeof v === "string";
const isStringArray = (v) => Array.isArray(v) && v.every((s) => typeof s === "string");
const isISODate = (v) => typeof v === "string" && validator.isISO8601(v, { strict: true });
const isTagIDs = (v) =>
    isObject(v) &&
    Object.entries(v).every(([type, ids]) => TAG_TYPES.includes(type) && isStringArray(ids));

/** Strips control and invisible characters from every string, run it before validating. */
export function sanitizeBoardValue(value, key = "") {
    if (typeof value === "string") {
        const text = validator.stripLow(value, MULTILINE_KEYS.includes(key));
        return validator.blacklist(text, HIDDEN_CHARS);
    }
    if (Array.isArray(value)) return value.map((item) => sanitizeBoardValue(item, key));
    if (isObject(value)) {
        return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [k, sanitizeBoardValue(v, k)]),
        );
    }
    return value;
}

// Collections are stored as [id, json] pairs
function checkEntries(value, checkJson) {
    if (!Array.isArray(value)) return "must be a list";
    for (const [i, entry] of value.entries()) {
        if (!Array.isArray(entry) || !isFilled(entry[0]) || !isObject(entry[1]))
            return `[${i}] must be an [id, object] pair`;
        const error = checkJson(entry[1]);
        if (error) return `[${i}] ${error}`;
    }
    return null;
}

function checkTag(json, type) {
    if (!isFilled(json.id)) return "needs an id";
    if (json.type !== type) return `must be a ${type} tag`;
    if (typeof json.name !== "string" || validator.isEmpty(json.name, { ignore_whitespace: true }))
        return "needs a name";
    if (json.linkedAccountIds !== undefined && !isStringArray(json.linkedAccountIds))
        return "has invalid linkedAccountIds";
    return null;
}

function checkParty(party) {
    if (!isObject(party) || !isFilled(party.id) || !isFilled(party.name))
        return "needs an id and name";
    if (!isOptionalString(party.note)) return "has an invalid note";
    if (party.tagIDs !== undefined && !isTagIDs(party.tagIDs)) return "has invalid tagIDs";
    return null;
}

function checkGame(json) {
    if (!isFilled(json.id)) return "needs an id";
    if (typeof json.title !== "string") return "needs a title";
    for (const key of ["sortingTitle", "coverImageURL", "coverThumbURL"])
        if (!isOptionalString(json[key])) return `has an invalid ${key}`;
    if (json.parties === undefined) return null;
    if (!Array.isArray(json.parties)) return "has invalid parties";
    for (const [i, party] of json.parties.entries()) {
        const error = checkParty(party);
        if (error) return `parties[${i}] ${error}`;
    }
    return null;
}

function checkReminders(value) {
    if (!Array.isArray(value)) return "must be a list";
    for (const [i, r] of value.entries()) {
        const valid =
            isObject(r) &&
            isFilled(r.id) &&
            isFilled(r.gameID) &&
            isFilled(r.partyID) &&
            isFilled(r.message) &&
            isISODate(r.date);
        if (!valid) return `[${i}] is not a valid reminder`;
    }
    return null;
}

function checkDefaultFilters(value) {
    if (!isObject(value)) return "must be an object";
    if (!isOptionalString(value.search)) return "has an invalid search";
    for (const key of ["selectedTagIDs", "excludedTagIDs"])
        if (value[key] !== undefined && !isTagIDs(value[key])) return `has invalid ${key}`;
    return null;
}

const CHECKS = {
    ...Object.fromEntries(
        Object.entries(TAG_COLLECTIONS).map(([key, type]) => [
            key,
            (value) => checkEntries(value, (json) => checkTag(json, type)),
        ]),
    ),
    allGames: (value) => checkEntries(value, checkGame),
    allReminders: checkReminders,
    tagsCustomOrders: (value) =>
        isObject(value) && TAG_TYPES.every((type) => isStringArray(value[type]))
            ? null
            : "must have a list of tag ids per tag type",
    settings: (value) => (isObject(value) ? null : "must be an object"),
    defaultFilters: checkDefaultFilters,
    version: (value) => (typeof value === "string" ? null : "must be a string"),
    activityHistory: (value) => (Array.isArray(value) ? null : "must be a list"),
};

/** Validates a single board key's value, as sent by a partial update. */
export function validateBoardValue(key, value) {
    const check = CHECKS[key];
    if (!check) return `Unknown board key "${key}".`;
    const error = check(value);
    return error ? `Invalid ${key}: ${error}.` : null;
}

// Collections the client expects on every non-empty board
const REQUIRED_KEYS = [...Object.keys(TAG_COLLECTIONS), "allGames"];

/** Validates a whole board as sent by a full save. */
export function validateBoardData(data) {
    if (!isObject(data)) return "Board data must be an object.";
    for (const key of REQUIRED_KEYS) if (!(key in data)) return `Board data is missing ${key}.`;
    for (const [key, value] of Object.entries(data)) {
        const error = validateBoardValue(key, value);
        if (error) return error;
    }
    return null;
}
