// Enforced in the backend and the frontend use them for reference.
export const MAX_OWNED_BOARDS = 10;
export const GUEST_PASSWORD_MIN_LENGTH = 8;
export const MAX_BOARD_HISTORY_ENTRIES = 30;
export const MAX_BOARD_HISTORY_MESSAGE_LENGTH = 300;

// Limits to strings length to user inputs.
export const STRING_LIMITS = Object.freeze({
    PARTY_NOTE: 2000,
    GAME_NAME: 256, // similar to the Steam limit
    BOARD_NAME: 96,
    PARTY_NAME: 64,
    TAG_NAME: 32,
});

export {};

