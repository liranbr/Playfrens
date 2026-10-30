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

/** Tracks which boards the user can access and which one is active. */
export class BoardStore {
    /**
     * Boards the user can access, from listBoards(). shortId is used in /app/<shortId> URLs.
     * @type {{
     *     id: string,
     *     shortId: string,
     *     name: string,
     *     role: "owner" | "guest",
     *     isPublic: boolean,
     *     owner: { id: string, displayName: string, avatarURL: string | null },
     * }[]}
     */
    boards = [];
    /** @type {string | null} */
    activeBoardId = null;
    /** True until the boards list or public board has loaded. */
    loading = true;
    /**
     * While logged out, selective information regarding the public board is sent and set here.
     * @type {{
     *     id: string,
     *     shortId: string,
     *     name: string,
     *     owner: { displayName: string, avatarURL: string | null },
     * } | null}
     */
    publicBoard = null;
    /**
     * Cached users when loading the board members.
     * @type {Map<string, {
     *     id: string,
     *     displayName: string,
     *     avatarURL: string | null,
     *     username: string | null,
     *     role: "owner" | "guest",
     * }[]>}
     */
    #usersCache = new Map();

    constructor() {
        makeAutoObservable(this);
    }

    /** The board currently being viewed. */
    get activeBoard() {
        if (this.publicBoard) return this.publicBoard;
        return this.boards.find((b) => b.id === this.activeBoardId) ?? null;
    }

    /** @returns {boolean} true when viewing a public board you're not on */
    get isReadOnly() {
        return this.publicBoard !== null;
    }

    /** @returns {number} */
    get ownedBoardsCount() {
        return this.boards.filter((b) => b.role === "owner").length;
    }

    /** @returns {boolean} false once you own MAX_OWNED_BOARDS */
    get canCreateBoard() {
        return this.ownedBoardsCount < MAX_OWNED_BOARDS;
    }

    /** @returns {boolean} whether you own the active board, always false on public boards while logged out */
    get isOwner() {
        return this.activeBoard?.role === "owner";
    }

    /**
     * Loads the boards list and opens the requested, last used, or first owned board.
     * @param {string} [targetBoard] board to open after inside the page login, otherwise the URL's
     * @returns {Promise<void>}
     */
    async populate(targetBoard) {
        const boards = await listBoards();
        const requestedId = targetBoard ?? this.getRequestedBoardIdFromURL();
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
            this.publicBoard = null;
            this.loading = false;
        });

        if (resolvedId) await this.#loadActiveBoard();
    }

    /**
     * Loads a public board read-only.
     * @param {string | null} [shortId] defaults to the URL's
     * @returns {Promise<boolean>} false if it's private or missing
     */
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
                owner: board.owner,
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

    /**
     * Owner only.
     * @param {string} boardId
     * @param {boolean} isPublic
     */
    async setVisibility(boardId, isPublic) {
        const result = await setBoardVisibilityAPI(boardId, isPublic);
        runInAction(() => {
            const board = this.boards.find((b) => b.id === boardId);
            if (board) board.isPublic = result;
        });
    }

    /**
     * Remembers the board and reloads the app on it.
     * @param {string} boardId
     */
    switchBoard(boardId) {
        if (boardId === this.activeBoardId) return;
        saveToStorage(LAST_BOARD_STORAGE_KEY, boardId);
        window.location.assign("/app");
    }

    /**
     * Null if not fetched yet.
     * @param {string} boardId
     */
    getCachedUsers(boardId) {
        return this.#usersCache.get(boardId) ?? null;
    }

    /**
     * @param {string} boardId
     * @param {object[]} users from listBoardUsers()
     */
    setCachedUsers(boardId, users) {
        this.#usersCache.set(boardId, users);
    }

    /** @param {string} boardId */
    invalidateUsersCache(boardId) {
        this.#usersCache.delete(boardId);
    }

    /** Re-fetches the boards list, e.g. after a rename or visibility change. */
    async refreshBoardsList() {
        const boards = await listBoards();
        runInAction(() => {
            this.boards = boards;
        });
    }

    /**
     * Creates a board and switches to it. Throws if you're at MAX_OWNED_BOARDS or the request fails.
     * @param {string} [name]
     * @returns {Promise<{ id: string, shortId: string, name: string, role: "owner" }>}
     */
    async createBoard(name) {
        const board = await createBoardAPI(name);
        await this.refreshBoardsList();
        this.switchBoard(board.id);
        return board;
    }

    /**
     * Owner only.
     * @param {string} boardId
     * @param {string} name
     */
    async renameBoard(boardId, name) {
        await renameBoardAPI(boardId, name);
        await this.refreshBoardsList();
    }

    /**
     * Owner only, switches to another board if the deleted one was active.
     * @param {string} boardId
     */
    async deleteBoard(boardId) {
        await deleteBoardAPI(boardId);
        const wasActive = boardId === this.activeBoardId;
        await this.refreshBoardsList();
        if (!wasActive) return;

        const next = this.boards[0];
        if (next) this.switchBoard(next.id);
        else window.location.assign("/app"); // shouldn't happen - see above
    }

    /** Loads the active board's data and subscribes to its live updates. */
    async #loadActiveBoard() {
        resetRequestQueue();
        saveToStorage(LAST_BOARD_STORAGE_KEY, this.activeBoardId);

        await globalDataStore.populate(this.activeBoardId);
        globalSettingsStore.populateBoardSettings(loadFromStorage(settingsStorageKey, {}));
        globalFilterStore.populate(loadFromStorage(defaultFiltersStorageKey, {}));
        globalDataStore.watchSettingsForBackendSync();

        subscribeToBoard(this.activeBoardId);
    }

    /** @returns {string | null} the id or shortId from /app/<id> or /board/<id> */
    getRequestedBoardIdFromURL() {
        const match = window.location.pathname.match(/^\/(?:app|board)\/([^/]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }
}

export const globalBoardStore = new BoardStore();
const BoardStoreContext = createContext(globalBoardStore);
export const useBoardStore = () => useContext(BoardStoreContext);
