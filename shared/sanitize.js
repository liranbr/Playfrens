import validator from "validator";

const HIDDEN_CHARS = "\\x80-\\x9F\\u200B\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069\\uFEFF";
const MULTILINE_KEYS = new Set(["note", "message"]);
const SECRET_KEYS = new Set(["password", "token", "token_hash", "access_token"]);
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

export const cleanText = (text, mutiline = false) =>
    validator.blacklist(validator.stripLow(text, mutiline), HIDDEN_CHARS);

export function sanitizeDeep(value, key = "") {
    if (typeof value === "string")
        return SECRET_KEYS.has(key) ? value : cleanText(value, MULTILINE_KEYS.has(key));
    if (Array.isArray(value)) return value.map((v) => sanitizeDeep(v, key));
    if (value && typeof value === "object")
        return Object.fromEntries(
            Object.entries(value)
                .filter(([k]) => !UNSAFE_KEYS.has(k))
                .map(([k, v]) => [k, sanitizeDeep(v, k)]),
        );

    return value;
}
