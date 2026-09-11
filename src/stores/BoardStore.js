import { createContext, useContext } from "react";
import { makeAutoObservable, runInAction } from "mobx";
import { listBoards } from "@/APIUtils.js";
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

// Tracks which boards the user can access and which one is active.
export class BoardStore {
    boards = []; // [{ id, name, role: "owner" | "member" }]
    activeBoardId = null;
    loading = true;

    constructor() {
        makeAutoObservable(this);
    }

    get activeBoard() {
        return this.boards.find((b) => b.id === this.activeBoardId) ?? null;
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

    async switchBoard(boardId) {
        if (boardId === this.activeBoardId) return;
        runInAction(() => {
            this.activeBoardId = boardId;
        });
        await this.#loadActiveBoard();
    }

    async refreshBoardsList() {
        const boards = await listBoards();
        runInAction(() => {
            this.boards = boards;
        });
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
