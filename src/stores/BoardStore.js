import { createContext, useContext } from "react";
import { makeAutoObservable, runInAction } from "mobx";
import {
    createBoard as createBoardAPI,
    deleteBoard as deleteBoardAPI,
    getPublicBoard,
    listBoards,
    renameBoard as renameBoardAPI,
    setBoardVisibility as setBoardVisibilityAPI,
} from "@/APIUtils.js";
import { resetRequestQueue } from "@/services/RequestQueue.js";
import { subscribeToBoard } from "@/services/BoardSocket.js";
import {
    defaultFiltersStorageKey,
    globalDataStore,
    globalFilterStore,
    globalSettingsStore,
    settingsStorageKey,
} from "@/stores";
import { MAX_OWNED_BOARDS } from "#shared/boardLimits.js";
import { loadFromStorage, saveToStorage } from "@/Utils";

const LAST_BOARD_STORAGE_KEY = "last-active-board-id";

// Tracks which boards the user can access and which one is active.
export class BoardStore {
    boards = []; // [{ id, name, role: "owner" | "guest", isPublic }]
    activeBoardId = null;
    loading = true;
    // Viewing someone else's public board: { id, shortId, name, ownerName }
    publicBoard = null;
    #guestsCache = new Map();

    constructor() {
        makeAutoObservable(this);
    }

    get activeBoard() {
        if (this.publicBoard) return this.publicBoard;
        return this.boards.find((b) => b.id === this.activeBoardId) ?? null;
    }

    get isReadOnly() {
        return this.publicBoard !== null;
    }

    get ownedBoardsCount() {
        return this.boards.filter((b) => b.role === "owner").length;
    }

    get canCreateBoard() {
        return this.ownedBoardsCount < MAX_OWNED_BOARDS;
    }

    get isOwner() {
        return this.activeBoard?.role === "owner";
    }

    async populate() {
        const boards = await listBoards();
        const requestedId = this.getRequestedBoardIdFromURL();
        // A board link you're not a member of, view it as read only if it's public
        const isMember = boards.some((b) => b.shortId === requestedId || b.id === requestedId);
        if (requestedId && !isMember) {
            runInAction(() => (this.boards = boards));
            if (await this.populatePublic(requestedId)) return;
        }

        const lastUsedId = loadFromStorage(LAST_BOARD_STORAGE_KEY, null);
        const resolvedId =
            (requestedId &&
                boards.find((b) => b.shortId === requestedId || b.id === requestedId)?.id) ??
            (lastUsedId && boards.find((b) => b.id === lastUsedId)?.id) ??
            boards.find((b) => b.role === "owner")?.id ??
            boards[0]?.id ??
            null;

        runInAction(() => {
            this.boards = boards;
            this.activeBoardId = resolvedId;
            this.loading = false;
        });

        if (resolvedId) await this.#loadActiveBoard();
    }

    /** Loads a public board read-only, returns false if it's private or missing. */
    async populatePublic(shortId = this.getRequestedBoardIdFromURL()) {
        const board = shortId ? await getPublicBoard(shortId) : null;
        if (!board) {
            runInAction(() => (this.loading = false));
            return false;
        }

        runInAction(() => {
            this.publicBoard = {
                id: board.id,
                shortId: board.shortId,
                name: board.name,
                ownerName: board.ownerName,
            };
            this.activeBoardId = board.id;
            this.loading = false;
        });
        // No socket subscription or settings sync, viewers never write
        resetRequestQueue();
        await globalDataStore.populate(board.id, board);
        globalSettingsStore.populateBoardSettings(board.board.settings ?? {});
        globalFilterStore.populate(board.board.defaultFilters ?? {});
        return true;
    }

    async setVisibility(boardId, isPublic) {
        const result = await setBoardVisibilityAPI(boardId, isPublic);
        runInAction(() => {
            const board = this.boards.find((b) => b.id === boardId);
            if (board) board.isPublic = result;
        });
    }

    switchBoard(boardId) {
        if (boardId === this.activeBoardId) return;
        saveToStorage(LAST_BOARD_STORAGE_KEY, boardId);
        window.location.assign("/app");
    }

    getCachedGuests(boardId) {
        return this.#guestsCache.get(boardId) ?? null;
    }

    setCachedGuests(boardId, guests) {
        this.#guestsCache.set(boardId, guests);
    }

    invalidateGuestsCache(boardId) {
        this.#guestsCache.delete(boardId);
    }

    async refreshBoardsList() {
        const boards = await listBoards();
        runInAction(() => {
            this.boards = boards;
        });
    }

    // Throws if you're at MAX_OWNED_BOARDS or the request fails.
    async createBoard(name) {
        const board = await createBoardAPI(name);
        await this.refreshBoardsList();
        this.switchBoard(board.id);
        return board;
    }

    async renameBoard(boardId, name) {
        await renameBoardAPI(boardId, name);
        await this.refreshBoardsList();
    }

    async deleteBoard(boardId) {
        await deleteBoardAPI(boardId);
        const wasActive = boardId === this.activeBoardId;
        await this.refreshBoardsList();
        if (!wasActive) return;

        const next = this.boards[0];
        if (next) this.switchBoard(next.id);
        else window.location.assign("/app"); // shouldn't happen - see above
    }

    async #loadActiveBoard() {
        resetRequestQueue();
        saveToStorage(LAST_BOARD_STORAGE_KEY, this.activeBoardId);

        await globalDataStore.populate(this.activeBoardId);
        globalSettingsStore.populateBoardSettings(loadFromStorage(settingsStorageKey, {}));
        globalFilterStore.populate(loadFromStorage(defaultFiltersStorageKey, {}));
        globalDataStore.watchSettingsForBackendSync();

        subscribeToBoard(this.activeBoardId);
    }

    getRequestedBoardIdFromURL() {
        const match = window.location.pathname.match(/^\/(?:app|board)\/([^/]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }
}

export const globalBoardStore = new BoardStore();
const BoardStoreContext = createContext(globalBoardStore);
export const useBoardStore = () => useContext(BoardStoreContext);
