import { createContext, useContext } from "react";
import { makeAutoObservable, runInAction } from "mobx";
import {
    createBoard as createBoardAPI,
    deleteBoard as deleteBoardAPI,
    listBoards,
    renameBoard as renameBoardAPI,
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
import { loadFromStorage, saveToStorage } from "@/Utils";

const LAST_BOARD_STORAGE_KEY = "last-active-board-id";

// Capped to 3 for now
const MAX_OWNED_BOARDS = 3;

// Tracks which boards the user can access and which one is active.
export class BoardStore {
    boards = []; // [{ id, name, role: "owner" | "member" }]
    activeBoardId = null;
    loading = true;
    #membersCache = new Map();

    constructor() {
        makeAutoObservable(this);
    }

    get activeBoard() {
        return this.boards.find((b) => b.id === this.activeBoardId) ?? null;
    }

    get ownedBoardsCount() {
        return this.boards.filter((b) => b.role === "owner").length;
    }

    get canCreateBoard() {
        return this.ownedBoardsCount < MAX_OWNED_BOARDS;
    }

    async populate() {
        const boards = await listBoards();
        const lastUsedId = loadFromStorage(LAST_BOARD_STORAGE_KEY, null);
        const resolvedId =
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

    switchBoard(boardId) {
        if (boardId === this.activeBoardId) return;
        saveToStorage(LAST_BOARD_STORAGE_KEY, boardId);
        window.location.assign("/app");
    }

    getCachedMembers(boardId) {
        return this.#membersCache.get(boardId) ?? null;
    }

    setCachedMembers(boardId, members) {
        this.#membersCache.set(boardId, members);
    }

    invalidateMembersCache(boardId) {
        this.#membersCache.delete(boardId);
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
        globalSettingsStore.populate(loadFromStorage(settingsStorageKey, {}));
        globalFilterStore.populate(loadFromStorage(defaultFiltersStorageKey, {}));
        globalDataStore.watchSettingsForBackendSync();

        subscribeToBoard(this.activeBoardId);
    }
}

export const globalBoardStore = new BoardStore();
const BoardStoreContext = createContext(globalBoardStore);
export const useBoardStore = () => useContext(BoardStoreContext);
