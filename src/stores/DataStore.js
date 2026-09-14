import { computed, makeAutoObservable, ObservableMap, reaction, runInAction } from "mobx";
import { createContext, useContext } from "react";
import { getBoard, saveBoard, updateBoard } from "@/APIUtils.js";
import { FriendTagObject, TagObject } from "@/models";
import { globalSettingsStore } from "@/stores";
import {
    debounce,
    deepEqual,
    deleteItemFromArray,
    saveToStorage,
    toastError,
    toastInfo,
    toPlainObject,
} from "@/Utils";
import { setupAutoSorting } from "./DataStore/autoSorting.js";
import {
    backupToFile as backupToFileImpl,
    ExportDataStoreToJSON as exportDataStoreToJSON,
    restoreFromFile as restoreFromFileImpl,
    seedFirstVisitDefaults,
} from "./DataStore/backupRestore.js";
import { defaultTagsSample, storageKeys, storageKeyToTagType, tT } from "./DataStore/constants.js";
import {
    addGame,
    deleteGame,
    editGame,
    gameFromJson,
    importSteamGames,
    populateGames,
    preImportSteamGames,
    sortGamesByMethod,
} from "./DataStore/gameOperations.js";
import {
    addReminder,
    editReminder,
    getSortedReminders,
    populateReminders,
    removeReminder,
} from "./DataStore/reminderOperations.js";
import {
    addTag,
    allTagsFlatForEach,
    deleteTag,
    editTag,
    getTagByID,
    importFriends,
    isDraggedTagDropzoneNotOnSelf,
    moveTagCustomPosition,
    populateTags,
    populateTagsCustomOrders,
    populateTagsFromTagNames,
    preImportFriends,
    sortTagsByCustomOrder,
    sortTagsByMethod,
    updateAllTagFilteredGamesCounters,
    updateAllTagTotalGamesCounters,
    updateTagFilteredGamesCounter,
    updateTagTotalGamesCounter,
} from "./DataStore/tagOperations.js";

export { defaultFiltersStorageKey } from "./DataStore/constants.js";

// #============#
// ‖ DATA STORE ‖
// #============#

/**
 * @class
 * @property {{[key: string]: ObservableMap<String, TagObject>}} allTags
 * @property {ObservableMap<String, GameObject>} allGames
 * @property {{[key: string]: String[]}} tagsCustomOrders
 * @property {ReminderObject[]} allReminders
 */
export class DataStore {
    allTags = {
        [tT.friend]: new ObservableMap(),
        [tT.category]: new ObservableMap(),
        [tT.status]: new ObservableMap(),
    };
    allGames = new ObservableMap();
    // Custom Orders are saved as an array of Tag IDs, initialized from their current order when Custom Sort is first chosen
    tagsCustomOrders = {
        [tT.friend]: [],
        [tT.category]: [],
        [tT.status]: [],
    };
    allReminders = [];

    // True once the initial board load finishes, so we don't sync a half-populated board and clobber saved data.
    #isHydrated = false;
    // Per-key debounce timers, so rapid successive edits collapse into one backend request.
    #syncTimers = {};
    // Which board is currently loaded, set by populate() and read by every outgoing sync call.
    activeBoardId = null;
    // Last known `boards.last_updated` for the active board; used as the stale-write guard when
    // resending a whole collection array (see watchAndSyncCollection).
    #boardLastUpdated = null;
    // True while applying a change from the WebSocket, so reactions below don't sync it right back out.
    #applyingRemote = false;
    // storageKey -> last-synced [id, plainObject][] snapshot for the ObservableMap collections,
    // kept up to date by both outgoing syncs and incoming remote updates, so a remote update
    // never looks like a local diff on the next edit.
    #lastSyncedByKey = {};

    constructor() {
        makeAutoObservable(this, { sortedReminders: computed, anyFriendHasIcon: computed });

        // when any game is added/removed, update the totalGamesCounter in every tag
        reaction(
            () => this.allGames.keys(),
            () => this.updateAllTagTotalGamesCounters(),
            { fireImmediately: true },
        );
    }

    async populate(boardId) {
        this.activeBoardId = boardId;
        try {
            const response = await fetch(`/api/boards/${boardId}`);
            const json = await response.json();
            if (!response.ok) throw new Error(json.error);
            const board = json.board.board;
            this.#boardLastUpdated = json.board.last_updated;

            // Set to default via Empty Board for now.
            if (Object.keys(board).length === 0) {
                const data = defaultTagsSample();
                this.populateTagsFromTagNames(data);
                const saved = await saveBoard(this.activeBoardId, exportDataStoreToJSON(this));
                if (saved?.lastUpdated) this.#boardLastUpdated = saved.lastUpdated;
            } else {
                // Load from backend data
                this.populateTags({
                    [tT.friend]: board[storageKeys[tT.friend]],
                    [tT.category]: board[storageKeys[tT.category]],
                    [tT.status]: board[storageKeys[tT.status]],
                });
                await this.populateGames(board[storageKeys.games], board[storageKeys.version]);
                this.populateReminders(board[storageKeys.reminders]);
                this.populateTagsCustomOrders(board[storageKeys.tagsCustomOrders]);
                await saveToStorage(storageKeys.settings, board[storageKeys.settings]); // if it doesn't load correctly, need to reload
                await saveToStorage(storageKeys.defaultFilters, board[storageKeys.defaultFilters]);
            }
            this.#isHydrated = true;
        } catch (error) {
            console.info(error);
            toastError(error);
        }

        // Seed the "last synced" snapshots now that hydration is done, so the first reaction
        // tick diffs against real data.
        const snapshotOf = (map) => [...map.entries()].map(([id, v]) => [id, toPlainObject(v)]);
        this.#lastSyncedByKey[storageKeys[tT.friend]] = snapshotOf(this.allTags[tT.friend]);
        this.#lastSyncedByKey[storageKeys[tT.category]] = snapshotOf(this.allTags[tT.category]);
        this.#lastSyncedByKey[storageKeys[tT.status]] = snapshotOf(this.allTags[tT.status]);
        this.#lastSyncedByKey[storageKeys.games] = snapshotOf(this.allGames);

        // keep the backend in sync, per key
        const watchAndSync = (storageKey, item) => {
            reaction(
                () => JSON.stringify(item),
                () => {
                    if (this.#applyingRemote) return; // a remote update caused this change, don't echo it back
                    this.#syncKeyToBackend(storageKey, item);
                },
            );
        };
        watchAndSync(storageKeys.reminders, this.allReminders);
        watchAndSync(storageKeys.tagsCustomOrders, this.tagsCustomOrders);

        const watchAndSyncCollection = (storageKey, map) => {
            reaction(
                () => JSON.stringify(map), // rechecks below whenever anything in the map changes
                () => {
                    if (!this.#isHydrated || this.#applyingRemote) return;

                    const lastSynced = this.#lastSyncedByKey[storageKey];
                    const current = [...map.entries()];
                    const lastByID = new Map(lastSynced);

                    // same amount of entries, and every current ID was already known -> nothing added/removed
                    const sameIDs =
                        current.length === lastSynced.length &&
                        current.every(([id]) => lastByID.has(id));

                    // which entries actually differ - only worth checking if membership is unchanged
                    const changed = sameIDs
                        ? current.filter(
                              // postgres doesn't preserve key order, so a plain string compare would call every entry "changed"
                              ([id, v]) => !deepEqual(toPlainObject(v), lastByID.get(id)),
                          )
                        : [];

                    // re-order or only a non-persisted field changed (like a tag's game count), nothing to send
                    if (sameIDs && changed.length === 0) return;

                    // an entry was added/removed, or several changed at once, then just resend everything
                    const snapshot = current.map(([id, v]) => [id, toPlainObject(v)]);
                    debounce(
                        this.#syncTimers,
                        storageKey,
                        () =>
                            this.#pushBoardUpdate([storageKey], snapshot, {
                                getExpectedLastUpdated: () => this.#boardLastUpdated,
                                onStaleWrite: () => {
                                    toastError(
                                        "Someone else on this board made a change at the same " +
                                            "time, so this change didn't apply and was synced " +
                                            "back to the latest instead.",
                                    );
                                    this.#recoverFromStaleWrite(storageKey);
                                },
                            }),
                        100,
                    );
                    this.#lastSyncedByKey[storageKey] = snapshot;
                },
            );
        };
        watchAndSyncCollection(storageKeys[tT.friend], this.allTags[tT.friend]);
        watchAndSyncCollection(storageKeys[tT.category], this.allTags[tT.category]);
        watchAndSyncCollection(storageKeys[tT.status], this.allTags[tT.status]);
        watchAndSyncCollection(storageKeys.games, this.allGames);
    }

    // Debounced partial update (update_board_path) instead of re-uploading the whole board.
    #syncKeyToBackend(storageKey, item, delay = 100) {
        if (!this.#isHydrated) return;
        debounce(
            this.#syncTimers,
            storageKey,
            () =>
                this.#pushBoardUpdate([storageKey], item, {
                    getExpectedLastUpdated: () => this.#boardLastUpdated,
                    onStaleWrite: () => {
                        toastError(
                            "Someone else on this board made a change at the same time, so " +
                                "this change didn't apply and was synced back to the latest instead.",
                        );
                        this.#recoverFromStaleWrite(storageKey);
                    },
                }),
            delay,
        );
    }

    async #pushBoardUpdate(path, value, { getExpectedLastUpdated, onStaleWrite } = {}) {
        try {
            const result = await updateBoard(
                this.activeBoardId,
                path,
                value,
                getExpectedLastUpdated,
            );
            if (result?.lastUpdated) this.#boardLastUpdated = result.lastUpdated;
        } catch (err) {
            if (err?.staleWrite) onStaleWrite?.();
        }
    }

    // So it can self correct on stale write if there was a desync
    async #recoverFromStaleWrite(storageKey) {
        const fresh = await getBoard(this.activeBoardId);
        if (!fresh) return;
        this.applyRemoteUpdate([storageKey], fresh.board[storageKey], fresh.last_updated);
    }

    // For stores that own board data outside DataStore (Settings, saved Default Filters) to sync their own key.
    syncBoardKeyToBackend(storageKey, item, delay = 100) {
        this.#syncKeyToBackend(storageKey, item, delay);
    }

    // Call only after SettingsStore's initial populate, otherwise this echoes the just-loaded settings right back.
    watchSettingsForBackendSync() {
        reaction(
            () => JSON.stringify(globalSettingsStore),
            () => {
                if (this.#applyingRemote) return;
                this.syncBoardKeyToBackend(storageKeys.settings, globalSettingsStore, 1000);
            },
        );
    }

    // Lets gameOperations.js's populateGames() keep #boardLastUpdated in sync after its own
    // save but also not exposing the private field itself outside this class.
    setBoardLastUpdated(lastUpdated) {
        this.#boardLastUpdated = lastUpdated;
    }

    // #===========#
    // ‖ LIVE SYNC ‖
    // #===========#

    /**
     * Runs `fn` with outgoing sync reactions suppressed, so applying an incoming WebSocket
     * change doesn't immediately sync it right back.
     */
    withRemoteApplyGuard(fn) {
        this.#applyingRemote = true;
        try {
            runInAction(fn);
        } catch (err) {
            console.error("Error applying a remote board update:", err);
            toastError(
                "Something went wrong applying a live update. Refresh if things seem stuck.",
            );
        } finally {
            this.#applyingRemote = false;
        }
    }

    /** Applies a `{type: "board-update", path, value}` message received over the WebSocket. */
    applyRemoteUpdate(path, value, lastUpdated) {
        this.withRemoteApplyGuard(() => {
            this.#applyPathValue(path, value);
            if (lastUpdated) this.#boardLastUpdated = lastUpdated;
        });
    }

    /**
     * Applies a fresh [id, json] snapshot into ObservableMap
     * This is so a dialog holding a reference to one specific object sees the update live.
     */
    #patchCollection(map, entries, construct, onRemoved) {
        const incomingIds = new Set();
        for (const [id, json] of entries) {
            incomingIds.add(id);
            const existing = map.get(id);
            if (existing) existing.patchFromJSON(json);
            else map.set(id, construct(json));
        }
        for (const id of [...map.keys()]) {
            if (!incomingIds.has(id)) {
                onRemoved?.(map.get(id));
                map.delete(id);
            }
        }
    }

    #applyPathValue(path, value) {
        const [storageKey] = path;

        const tagType = storageKeyToTagType[storageKey];
        if (tagType !== undefined) {
            const Ctor = tagType === tT.friend ? FriendTagObject : TagObject;
            const entries = (value ?? []).filter(Boolean);
            this.#patchCollection(
                this.allTags[tagType],
                entries,
                (json) => new Ctor(json),
                // Prune from every game's parties too, like the local deleteTag() path,
                // or a dangling tag ID crashes GamePage on open.
                (removedTag) => this.allGames.forEach((game) => game.silentRemoveTag(removedTag)),
            );
            this.#lastSyncedByKey[storageKey] = entries;
            return;
        }

        if (storageKey === storageKeys.games) {
            const entries = (value ?? []).filter(([id, gameJson]) => id && gameJson?.id);
            this.#patchCollection(
                this.allGames,
                entries,
                (json) => gameFromJson(json),
                // Prune its reminders too, like the local deleteGame() path,
                // or a dangling reminder crashes ReminderCard.
                (removedGame) => {
                    for (const reminder of [...this.allReminders]) {
                        if (reminder.gameID === removedGame.id) {
                            deleteItemFromArray(this.allReminders, reminder);
                        }
                    }
                },
            );
            this.#lastSyncedByKey[storageKey] = entries;
            return;
        }

        if (storageKey === storageKeys.reminders) return this.populateReminders(value);
        if (storageKey === storageKeys.tagsCustomOrders)
            return this.populateTagsCustomOrders(value);

        console.warn(`applyRemoteUpdate: unhandled storageKey "${storageKey}"`);
    }

    notifyRemoteBoardReplaced(lastUpdated) {
        if (lastUpdated) this.#boardLastUpdated = lastUpdated;
        toastInfo("This board's data was replaced (e.g. a backup restore). Refreshing...");
        window.location.reload();
    }

    notifyBoardDeleted() {
        toastError("This board was deleted.");
    }

    populateTagsFromTagNames(tagCollection) {
        return populateTagsFromTagNames(this, tagCollection);
    }

    /** @param {{[key: string]: any[]}} tagCollection - object holding, per tagType, an array of [id, serialized TagObject] entries */
    populateTags(tagCollection) {
        return populateTags(this, tagCollection);
    }

    getTagByID(id, tagType = null) {
        return getTagByID(this, id, tagType);
    }

    addTag(tag) {
        return addTag(this, tag);
    }

    preImportFriends(remoteFriends) {
        return preImportFriends(this, remoteFriends);
    }

    importFriends(remoteFriends) {
        return importFriends(this, remoteFriends);
    }

    deleteTag(tag) {
        return deleteTag(this, tag);
    }

    editTag(tag, data = {}) {
        return editTag(this, tag, data);
    }

    allTagsFlatForEach(callbackfn) {
        return allTagsFlatForEach(this, callbackfn);
    }

    updateAllTagTotalGamesCounters() {
        return updateAllTagTotalGamesCounters(this);
    }

    updateTagTotalGamesCounter(tag) {
        return updateTagTotalGamesCounter(this, tag);
    }

    /** @param {(game: GameObject, tag: TagObject) => boolean} doesGameQualifyForTag - also know as FilterStore.doesGameQualifyForTag */
    updateAllTagFilteredGamesCounters(doesGameQualifyForTag) {
        return updateAllTagFilteredGamesCounters(this, doesGameQualifyForTag);
    }

    /** @param {(game: GameObject, tag: TagObject) => boolean} doesGameQualifyForTag - used whenever adding/removing a tag from a game. not the prettiest, but is efficient */
    updateTagFilteredGamesCounter(tag, doesGameQualifyForTag) {
        return updateTagFilteredGamesCounter(this, tag, doesGameQualifyForTag);
    }

    populateTagsCustomOrders(tagOrderJsons) {
        return populateTagsCustomOrders(this, tagOrderJsons);
    }

    moveTagCustomPosition(tagDragged, tagDroppedOn, direction) {
        return moveTagCustomPosition(this, tagDragged, tagDroppedOn, direction);
    }

    isDraggedTagDropzoneNotOnSelf(tagDragged, tagDraggedOver, direction) {
        return isDraggedTagDropzoneNotOnSelf(this, tagDragged, tagDraggedOver, direction);
    }

    sortTagsByMethod(tagType, sortMethod, isDescending) {
        return sortTagsByMethod(this, tagType, sortMethod, isDescending);
    }

    sortTagsByCustomOrder(tagType, isDescending) {
        return sortTagsByCustomOrder(this, tagType, isDescending);
    }

    async populateGames(gameJsons, version) {
        return populateGames(this, gameJsons, version);
    }

    addGame(
        title,
        coverImageURL,
        coverThumbURL,
        coverIsOfficial,
        sortingTitle,
        storeType,
        storeID,
        sgdbID,
    ) {
        return addGame(
            this,
            title,
            coverImageURL,
            coverThumbURL,
            coverIsOfficial,
            sortingTitle,
            storeType,
            storeID,
            sgdbID,
        );
    }

    preImportSteamGames(remoteGames) {
        return preImportSteamGames(this, remoteGames);
    }

    importSteamGames(remoteGames) {
        return importSteamGames(this, remoteGames);
    }

    deleteGame(game) {
        return deleteGame(this, game);
    }

    editGame(
        game,
        title,
        coverImageURL,
        coverThumbURL,
        coverIsOfficial,
        sortingTitle,
        storeType,
        storeID,
        sgdbID,
    ) {
        return editGame(
            this,
            game,
            title,
            coverImageURL,
            coverThumbURL,
            coverIsOfficial,
            sortingTitle,
            storeType,
            storeID,
            sgdbID,
        );
    }

    sortGamesByMethod(sortMethod, isDescending) {
        return sortGamesByMethod(this, sortMethod, isDescending);
    }

    populateReminders(reminderJsons) {
        return populateReminders(this, reminderJsons);
    }

    /** @returns {ReminderObject[]} */
    get sortedReminders() {
        return getSortedReminders(this.allReminders);
    }

    get anyFriendHasIcon() {
        return [...this.allTags[tT.friend].values()].some((friend) => friend.iconURL);
    }

    /** @param {ReminderObject} reminder */
    addReminder(reminder) {
        return addReminder(this, reminder);
    }

    removeReminder(reminder) {
        return removeReminder(this, reminder);
    }

    editReminder(reminder, newDate, newMessage) {
        return editReminder(this, reminder, newDate, newMessage);
    }
}

const dataStore = new DataStore();
// Prefer to use the context version in components, for expanded functionality in the future
// but the global version is available for non-component uses
const DataStoreContext = createContext(dataStore);
export const useDataStore = () => useContext(DataStoreContext);
export const globalDataStore = dataStore;

setupAutoSorting(dataStore);

// #=============#
// ‖ FILE BACKUP ‖
// #=============#

export function ExportDataStoreToJSON() {
    return exportDataStoreToJSON(dataStore);
}

export function backupToFile() {
    return backupToFileImpl(dataStore);
}

export function restoreFromFile(file) {
    return restoreFromFileImpl(dataStore, file);
}

// #==========================#
// ‖ FIRST VISIT DEFAULT TAGS ‖
// #==========================#
seedFirstVisitDefaults(dataStore);
