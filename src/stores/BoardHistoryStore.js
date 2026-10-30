import { makeAutoObservable } from "mobx";
import { appendBoardHistory } from "@/APIUtils.js";
import { MAX_BOARD_HISTORY_ENTRIES } from "#shared/boardLimits.js";
import { setToastListener } from "@/Utils";

/**
 * @typedef {{
 *   id: string, message: string, date: string,
 *   author: { id: string, name: string } | null,
 *   gameLink: { gameID: string, partyID?: string } | null,
 * }} HistoryEntry
 */

// Drops malformed entries, since a restored backup file could contain anything
export function sanitizeBoardHistory(entries) {
    if (!Array.isArray(entries)) return [];
    const isString = (v) => typeof v === "string";
    return entries
        .filter((e) => e && isString(e.id) && isString(e.message) && isString(e.date))
        .slice(0, MAX_BOARD_HISTORY_ENTRIES)
        .map((e) => ({
            id: e.id,
            message: e.message,
            date: e.date,
            author: isString(e.author?.name)
                ? { id: isString(e.author.id) ? e.author.id : "", name: e.author.name }
                : null,
            gameLink: isString(e.gameLink?.gameID)
                ? {
                      gameID: e.gameLink.gameID,
                      partyID: isString(e.gameLink.partyID) ? e.gameLink.partyID : undefined,
                  }
                : null,
        }));
}

// The active board's shared activity history (board.activityHistory), newest first
class BoardHistoryStore {
    boardId = null;
    /** @type {HistoryEntry[]} */
    entries = [];

    constructor() {
        makeAutoObservable(this);
        setToastListener((message, gameLink) => this.record(message, gameLink));
    }

    populate(boardId, entries) {
        this.boardId = boardId;
        this.entries = sanitizeBoardHistory(entries);
    }

    async record(message, gameLink) {
        if (!this.boardId) return;
        try {
            this.receive(await appendBoardHistory(this.boardId, message, gameLink));
        } catch (err) {
            console.warn("Couldn't save board history:", err);
        }
    }

    // From our own request or the board socket, whichever comes first
    receive(entry) {
        const [clean] = sanitizeBoardHistory([entry]);
        if (!clean || this.entries.some((e) => e.id === clean.id)) return;
        this.entries.unshift(clean);
        if (this.entries.length > MAX_BOARD_HISTORY_ENTRIES)
            this.entries.length = MAX_BOARD_HISTORY_ENTRIES;
    }
}

export const globalBoardHistoryStore = new BoardHistoryStore();
