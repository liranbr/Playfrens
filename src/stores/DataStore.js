import { action, computed, makeAutoObservable, ObservableMap, reaction, runInAction } from "mobx";
import { createContext, useContext } from "react";
import { getOfficialCoverImageURLs, saveBoard, updateBoard } from "@/APIUtils.js";
import {
    compareGameTitlesAZ,
    compareTagFilteredGamesCount,
    compareTagNamesAZ,
    compareTagTotalGamesCount,
    FriendTagObject,
    GameObject,
    ReminderObject,
    storeTypes,
    TagObject,
    tagTypes,
} from "@/models";
import { Party } from "@/models/GameObject.js";
import { globalSettingsStore, settingsStorageKey, userStore } from "@/stores";
import {
    coverToThumb,
    debounce,
    deepEqual,
    deleteItemFromArray,
    ensureUniqueName,
    loadFromStorage,
    moveItemInArray,
    saveToStorage,
    setToastSilence,
    shouldUpdateObject,
    toastError,
    toastInfo,
    toastSuccess,
    toPlainObject,
    updateObject,
} from "@/Utils";
import { SortingReaction } from "./SortingReaction.js";
import { version } from "/package.json";

const tT = tagTypes; // Short alias for convenience, used a lot here
export const defaultFiltersStorageKey = "defaultFilters";
const storageKeys = {
    [tT.friend]: "allFriends",
    [tT.category]: "allCategories",
    [tT.status]: "allStatuses",
    games: "allGames",
    reminders: "allReminders",
    settings: settingsStorageKey,
    defaultFilters: defaultFiltersStorageKey,
    version: "version",
    visited: "visited",
    tagsCustomOrders: "tagsCustomOrders",
};

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

    constructor() {
        makeAutoObservable(this, { sortedReminders: computed });

        // when any game is added/removed, update the totalGamesCounter in every tag
        reaction(
            () => this.allGames.keys(),
            () => this.updateAllTagTotalGamesCounters(),
            { fireImmediately: true },
        );
    }

    async populate() {
        try {
            const response = await fetch("/api/board");
            const json = await response.json();
            if (!response.ok) throw new Error(json.error);
            const board = json.board.board;

            // Set to default via Empty Board for now.
            if (Object.keys(board).length === 0) {
                const data = defaultTagsSample();
                this.populateTagsFromTagNames(data);
                await saveBoard(ExportDataStoreToJSON());
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

        // keep the backend in sync, per key
        const watchAndSync = (storageKey, item) => {
            reaction(
                () => JSON.stringify(item),
                () => this.#syncKeyToBackend(storageKey, item),
            );
        };
        watchAndSync(storageKeys.reminders, this.allReminders);
        watchAndSync(storageKeys.tagsCustomOrders, this.tagsCustomOrders);

        const watchAndSyncCollection = (storageKey, map) => {
            let lastSynced = [...map.entries()].map(([id, v]) => [id, toPlainObject(v)]);

            reaction(
                () => JSON.stringify(map), // rechecks below whenever anything in the map changes
                () => {
                    if (!this.#isHydrated) return;

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

                    if (sameIDs && changed.length === 1) {
                        // exactly one entry changed, so patch just that array slot
                        const [id, value] = changed[0];
                        const snapshot = toPlainObject(value);
                        const index = lastSynced.findIndex(([lastID]) => lastID === id);
                        debounce(
                            this.#syncTimers,
                            `${storageKey}::${id}`, // own timer per entry, so editing two things doesn't cancel either update
                            () => updateBoard([storageKey, index], [id, snapshot]).catch(() => {}),
                            100,
                        );
                        lastSynced[index] = [id, snapshot]; // remember what we just sent
                        return;
                    }

                    // an entry was added/removed, or several changed at once, then just resend everything
                    const snapshot = current.map(([id, v]) => [id, toPlainObject(v)]);
                    this.#syncKeyToBackend(storageKey, snapshot);
                    lastSynced = snapshot;
                },
            );
        };
        watchAndSyncCollection(storageKeys[tT.friend], this.allTags[tT.friend]);
        watchAndSyncCollection(storageKeys[tT.category], this.allTags[tT.category]);
        watchAndSyncCollection(storageKeys[tT.status], this.allTags[tT.status]);
        watchAndSyncCollection(storageKeys.games, this.allGames);
    }

    // Debounced partial update (update_board_path) instead of re-uploading the whole board.
    #syncKeyToBackend(storageKey, item) {
        if (!this.#isHydrated) return;
        debounce(
            this.#syncTimers,
            storageKey,
            () => updateBoard([storageKey], item).catch(() => {}),
            100,
        );
    }

    // For stores that own board data outside DataStore (Settings, saved Default Filters) to sync their own key.
    syncBoardKeyToBackend(storageKey, item) {
        this.#syncKeyToBackend(storageKey, item);
    }

    // Call only after SettingsStore's initial populate, otherwise this echoes the just-loaded settings right back.
    watchSettingsForBackendSync() {
        reaction(
            () => JSON.stringify(globalSettingsStore),
            () => this.syncBoardKeyToBackend(storageKeys.settings, globalSettingsStore),
        );
    }

    // Used when loading some predefined set, like the starting defaults
    populateTagsFromTagNames(tagCollection) {
        for (const tagType in tagCollection) {
            this.allTags[tagType] = new ObservableMap(
                tagCollection[tagType]
                    .filter(Boolean) // skip potential nulls, undefined, "" etc.
                    .map((tagName) => new TagObject({ type: tagType, name: tagName }))
                    .map((tag) => [tag.id, tag]),
            );
        }
    }

    /** @param {{[key: string]: any[]}} tagCollection - object holding, per tagType, an array of [id, serialized TagObject] entries */
    populateTags(tagCollection) {
        for (const tagType in tagCollection) {
            this.allTags[tagType] = new ObservableMap(
                tagCollection[tagType]
                    .filter(Boolean)
                    .map(([id, tagJson]) => [
                        id,
                        new (tagType === "friend" ? FriendTagObject : TagObject)(tagJson),
                    ]),
            );
        }
    }

    deserializeGameTagIDs(gameTagIDs) {
        for (const tagType in gameTagIDs) {
            gameTagIDs[tagType] = new Set(gameTagIDs[tagType]); // sets are serialized as arrays
        }
        return gameTagIDs;
    }

    // eslint-disable-next-line no-unused-vars -- unused, kept for future use case.
    async populateGames(gameJsons, version) {
        const parseParties = (parties) => {
            return parties
                .filter((party) => {
                    if (!party || !party.id || !party.name) {
                        console.warn(`Skipping invalid party, id: ${party?.id}`);
                        return false;
                    }
                    return true;
                })
                .map((party) => {
                    return new Party({
                        ...party,
                        tagIDs: this.deserializeGameTagIDs(party.tagIDs),
                    });
                });
        };

        let changed = false;
        const entries = await Promise.all(
            gameJsons
                .filter(([id, gameJson]) => {
                    if (!id || !gameJson || !gameJson?.id) {
                        console.warn("Skipping invalid game. id: " + id + ", data:", gameJson);
                        return false;
                    }
                    return true;
                })
                .map(async ([id, gameJson]) => {
                    if (!gameJson.coverThumbURL) {
                        gameJson.coverThumbURL = await coverToThumb(gameJson.coverImageURL);
                        changed = true;
                    }
                    const game = new GameObject({
                        ...gameJson,
                        parties: parseParties(gameJson.parties),
                    });

                    return [id, game];
                }),
        );

        changed = (await this.#refreshOfficialCovers(entries)) || changed;

        runInAction(() => {
            this.allGames = new ObservableMap(entries);
            if (changed) saveBoard(ExportDataStoreToJSON()).catch(() => {});
        });
    }

    /**
     * Refreshes official store covers for games flagged coverIsOfficial.
     * @param {[string, GameObject][]} entries
     * @returns {Promise<boolean>} true if any cover was changed
     */
    async #refreshOfficialCovers(entries) {
        return false;
        const officialSteamGames = entries
            .map(([, game]) => game)
            .filter((game) => game.storeType === "steam" && game.coverIsOfficial && game.storeID);
        if (officialSteamGames.length === 0) return false; // Based and skin-pilled

        const covers = await getOfficialCoverImageURLs(
            "steam",
            officialSteamGames.map((game) => game.storeID),
        );
        if (!covers) return false;

        let changed = false;
        for (const game of officialSteamGames) {
            const cover = covers[game.storeID];
            if (!cover || cover.url === game.coverImageURL) continue;
            game.coverImageURL = cover.url;
            game.coverThumbURL = cover.thumb;
            changed = true;
        }
        return changed;
    }

    populateReminders(reminderJsons) {
        this.allReminders = [];
        if (typeof reminderJsons !== "object" || !Array.isArray(reminderJsons))
            return console.warn("Skipping invalid tagOrderJsons.");
        this.allReminders = reminderJsons
            .filter((reminder) => !!reminder.id)
            .map((reminder) => {
                if (!reminder.partyID) {
                    // one-time conversion for reminders made before GameObjects had parties
                    const reminderGame = this.allGames.get(reminder.gameID);
                    reminder.partyID = reminderGame.parties[0].id;
                }
                return new ReminderObject({ ...reminder });
            });
    }

    /** @returns {ReminderObject[]} */
    get sortedReminders() {
        return this.allReminders.toSorted((a, b) => a.date - b.date);
    }

    /** @param {ReminderObject} reminder */
    addReminder(reminder) {
        if (!(reminder instanceof ReminderObject))
            return toastError("Invalid reminder object: " + reminder);
        if (this.allReminders.some((r) => r.id === reminder.id))
            return toastError("Reminder with this ID already exists");
        if (reminder.message.length === 0) return toastError("Reminder must have a message");

        this.allReminders.push(reminder);
        return toastSuccess("Reminder added");
    }

    removeReminder(reminder) {
        const index = this.allReminders.findIndex((r) => r.id === reminder.id);
        if (index === -1) return toastError("Error deleting reminder");
        this.allReminders.splice(index, 1);
        return toastSuccess("Reminder deleted");
    }

    editReminder(reminder, newDate, newMessage) {
        const index = this.allReminders.findIndex((r) => r.id === reminder.id);
        if (index === -1) return toastError("Error editing reminder");
        if (!(newDate instanceof Date)) return toastError("Invalid Date");
        if (typeof newMessage !== "string" || !newMessage.trim())
            return toastError("Invalid Message");

        this.allReminders[index].date = newDate;
        this.allReminders[index].message = newMessage;
        return toastSuccess("Reminder edited");
    }

    populateTagsCustomOrders(tagOrderJsons) {
        this.tagsCustomOrders = {
            [tT.friend]: [],
            [tT.category]: [],
            [tT.status]: [],
        };
        if (typeof tagOrderJsons !== "object")
            return console.warn("Skipping invalid tagOrderJsons.");
        if (Object.keys(tagOrderJsons).length === 0)
            return console.warn("Skipping empty tagOrderJsons.");
        this.tagsCustomOrders = tagOrderJsons;
    }

    moveTagCustomPosition(tagDragged, tagDroppedOn, direction) {
        const validTagsToReposition =
            tagDragged &&
            tagDroppedOn &&
            tagDragged instanceof TagObject &&
            tagDroppedOn instanceof TagObject &&
            tagDragged.type === tagDroppedOn.type;
        if (!validTagsToReposition)
            return console.warn(`Invalid tag reposition, tags: ${tagDragged}, ${tagDroppedOn}`);

        const orderArray = this.tagsCustomOrders[tagDragged.type];
        const indexDragged = orderArray.indexOf(tagDragged.id);
        const indexDroppedOn = orderArray.indexOf(tagDroppedOn.id);
        const indexToGoTo = indexDroppedOn + (direction === "bottom" ? 1 : 0);
        moveItemInArray(orderArray, indexDragged, indexToGoTo);
        this.tagsCustomOrders[tagDragged.type] = [...orderArray]; // triggers reaction
    }

    isDraggedTagDropzoneNotOnSelf(tagDragged, tagDraggedOver, direction) {
        // If dragging a tag during custom-sort rearrangement, and you're hovering on the top of the neighbor tag right below you, this lets you know there's no need to show an effect
        const validTagsToCheck =
            tagDragged &&
            tagDraggedOver &&
            tagDragged instanceof TagObject &&
            tagDraggedOver instanceof TagObject &&
            tagDragged.type === tagDraggedOver.type;
        if (!validTagsToCheck) return;

        const orderArray = this.tagsCustomOrders[tagDragged.type];
        const indexDragged = orderArray.indexOf(tagDragged.id);
        const indexDraggedOver = orderArray.indexOf(tagDraggedOver.id);
        const indexToGoTo = indexDraggedOver + (direction === "bottom" ? 1 : 0);

        return !(indexToGoTo === indexDragged || indexToGoTo === indexDragged + 1); // +1 is also self because of the shifting array calculation. -1 isn't.
    }

    getTagByID(id, tagType = null) {
        if (tagType) return this.allTags[tagType].get(id);
        // as there's only a few tagTypes, and Map.get is O(1), this remains O(1)
        for (const tagMap in Object.values(this.allTags)) {
            const tag = tagMap.get(id);
            if (tag) return tag;
        }
        return null;
    }

    addTag(tag) {
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        const fullList = this.allTags[tag.type];

        if ([...fullList.values()].some((t) => t.id === tag.id))
            return toastError(`This tag already exists in the ${tag.typeStrings.plural} list`);

        tag.name = ensureUniqueName(
            [...fullList.values()].map((t) => t.name),
            tag.name,
        );

        fullList.set(tag.id, tag);
        const orderList = this.tagsCustomOrders[tag.type];
        if (orderList && orderList.length > 0) orderList.push(tag.id); // if Custom Sort was ever selected, thus an order was made
        return toastSuccess(`Added ${tag.name} to ${tag.typeStrings.plural} list`);
    }

    // Flags which needs to be added, updated or skipped.
    preImportFriends(remoteFriends) {
        const list = this.#preImportList();
        const currentFriendList = [...this.allTags[tagTypes.friend].values()];
        for (const remoteFriend of remoteFriends) {
            /** @type {FriendTagObject} */
            const frenExists = currentFriendList.find(
                (t) => t instanceof FriendTagObject && t.steamID === remoteFriend.steamID,
            );

            if (!frenExists) {
                list.toAdd.push(remoteFriend);
            } else if (shouldUpdateObject(frenExists, { iconURL: remoteFriend.iconURL })) {
                list.toUpdate.old.push(frenExists);
                list.toUpdate.latest.push(remoteFriend);
            } else {
                list.toSkip.push(remoteFriend);
            }
        }
        return list;
    }

    /**
     * Call preImportFriends before calling this function to get the list
     * Updates Friends using a list of sorted remote friend tags
     * @param {{ toAdd: object[], toUpdate: {old: object[], latest: object[]}, toSkip: object[] }} remoteFriends
     */
    importFriends(remoteFriends) {
        setToastSilence(true);
        const { old, latest } = remoteFriends.toUpdate;
        for (let i = 0; i < old.length && i < latest.length; i++)
            updateObject(old[i], { iconURL: latest[i].iconURL });
        const toAdd = remoteFriends.toAdd;
        toAdd.forEach((element) => {
            this.addTag(element);
        });
        setToastSilence(false);
        return remoteFriends.toAdd.length === 0 && remoteFriends.toUpdate.latest.length === 0
            ? toastInfo("Friends data is up to date.")
            : toastSuccess(
                  `Added ${remoteFriends.toAdd.length} to friend list. (${remoteFriends.toUpdate.latest.length} updated, ${remoteFriends.toSkip.length} skipped.)`,
              );
    }

    deleteTag(tag) {
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        if (!this.allTags[tag.type].has(tag.id))
            return toastError(`${tag.name} does not exist in ${tag.typeStrings.plural} list`);

        this.allGames.forEach((game) => game.silentRemoveTag(tag));
        this.allTags[tag.type].delete(tag.id);
        deleteItemFromArray(this.tagsCustomOrders[tag.type], tag.id);
        return toastSuccess(`Deleted ${tag.name} from ${tag.typeStrings.plural} list`);
    }

    oldEditTag(tag, { newName }) {
        if (tag.name === newName) return true; // nothing to do here, until adding more fields to edit
        // Editing needs to be in the DataStore rather than the object itself, to prevent duplicate names
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        const fullList = this.allTags[tag.type];
        const storedTag = fullList.get(tag.id);
        if (!storedTag)
            return toastError(`${tag.name} does not exist in ${tag.typeStrings.plural} list`);

        if (!newName || typeof newName !== "string" || !newName.trim())
            return toastError(`Cannot save a ${tag.typeStrings.single} without a name`);

        newName = ensureUniqueName(
            [...fullList.values()].map((t) => t.name),
            newName,
        );

        const oldName = tag.name;
        storedTag.name = newName;
        return toastSuccess(`Updated ${oldName} to ${newName} in ${tag.typeStrings.plural} list`);
    }

    editTag(tag, data = {}) {
        if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
        const fullList = this.allTags[tag.type];
        const storedTag = fullList.get(tag.id);
        if (!storedTag)
            return toastError(`${tag.name} does not exist in ${tag.typeStrings.plural} list.`);

        for (const key in data) {
            // Only for name tag we need to ensure "uniqueness".
            if (key === "name") {
                // Also make sure it was changed, skip otherwise.
                const newName = data[key];
                if (tag.name === newName) {
                    // Don't skip the other data!
                    if (Object.keys(data).length > 1) continue;
                    else return true;
                }

                if (!newName || typeof newName !== "string" || !newName.trim()) {
                    return toastError(`Cannot save a ${tag.typeStrings.single} without a name`);
                }
                data["name"] = ensureUniqueName(
                    [...fullList.values()].map((t) => t.name),
                    newName,
                );
                storedTag.name = data["name"];
            }
            // Defined inside so we should update the info
            else if (key in tag) {
                console.log(key);
                storedTag[key] = data[key];
            }
        }
        return toastSuccess(
            `Updated ${Object.keys(data).length > 1 ? `${Object.keys(data).length} enteries for` : ``} ${storedTag["name"]} in ${tag.typeStrings.plural} list`,
        );
    }

    allTagsFlatForEach(callbackfn) {
        for (const tagType in this.allTags) this.allTags[tagType].forEach(callbackfn);
    }

    updateAllTagTotalGamesCounters() {
        this.allTagsFlatForEach(
            (t) =>
                (t.totalGamesCount = [...this.allGames.values()].filter((game) =>
                    game.hasTag(t),
                ).length),
        );
    }

    updateTagTotalGamesCounter(tag) {
        const t = this.allTags[tag.type].get(tag.id);
        t.totalGamesCount = [...this.allGames.values()].filter((game) => game.hasTag(t)).length;
    }

    /** @param {(game: GameObject, tag: TagObject) => boolean} doesGameQualifyForTag - also know as FilterStore.doesGameQualifyForTag */
    updateAllTagFilteredGamesCounters(doesGameQualifyForTag) {
        this.allTagsFlatForEach(
            (t) =>
                (t.filteredGamesCount = [...this.allGames.values()].filter((game) =>
                    doesGameQualifyForTag(game, t),
                ).length),
        );
    }

    /** @param {(game: GameObject, tag: TagObject) => boolean} doesGameQualifyForTag - used whenever adding/removing a tag from a game. not the prettiest, but is efficient */
    updateTagFilteredGamesCounter(tag, doesGameQualifyForTag) {
        const t = this.allTags[tag.type].get(tag.id);
        t.filteredGamesCount = [...this.allGames.values()].filter((game) =>
            doesGameQualifyForTag(game, t),
        ).length;
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
        if (!title) {
            toastError("Cannot save a game without a title");
            return null;
        }
        if (!coverImageURL) {
            toastError("Cannot save a game without selecting a cover image");
            return null;
        }
        if (!coverThumbURL) {
            toastError("Cannot save a game without a cover thumbnail");
            return null;
        }
        if (storeType !== "custom" && !storeID) {
            toastError(
                `Cannot save a ${storeTypes[storeType]} game without selecting it from its search`,
            );
            return null;
        }
        const allGamesArray = [...this.allGames.values()];

        if (storeType !== "custom") {
            const identicalGame = allGamesArray.find(
                (g) => g.storeID === storeID && g.storeType === storeType, // Game with the same ID on the same store
            );
            if (identicalGame) {
                toastError(identicalGame.title + " already exists in the games list");
                return null;
            }
        }
        title = ensureUniqueName(
            allGamesArray.map((g) => g.title),
            title,
        );

        const newGame = new GameObject({
            title: title,
            coverImageURL: coverImageURL,
            coverThumbURL: coverThumbURL,
            coverIsOfficial: coverIsOfficial,
            sortingTitle: sortingTitle,
            storeType: storeType,
            storeID: storeID,
            sgdbID: sgdbID,
        });
        if (this.allGames.has(newGame.id))
            throw new Error(`What do you MEAN this uuid (${newGame.id}) already exists`);
        this.allGames.set(newGame.id, newGame);
        toastSuccess("Added " + title + " to games list");
        return newGame; // used to open the GamePage right after adding the game
    }

    preImportSteamGames(remoteGames) {
        const list = this.#preImportList();
        const currentGameList = [...this.allGames.values()];
        for (const remoteGame of remoteGames) {
            // Only import if its not from Steam and mismatched ID.
            /** @type {GameObject} */
            const gameExists = currentGameList.find((t) => {
                return (
                    t instanceof GameObject &&
                    t.storeID === remoteGame.storeID &&
                    t.storeType == "steam"
                );
            });

            if (!gameExists) list.toAdd.push(remoteGame);
            else list.toSkip.push(remoteGame);
        }

        return list;
    }

    /**
     * Call preImportSteamGames before calling this function to get the list
     * Add/Skip Games using a list of sorted remote game objects
     * @param {{ toAdd: object[], toUpdate: {old: object[], latest: object[]}, toSkip: object[] }} remoteGames
     */
    importSteamGames(remoteGames) {
        const { toAdd } = remoteGames;
        if (!toAdd) return;
        toAdd.forEach((element) => {
            const {
                title,
                coverImageURL,
                coverThumbURL,
                sortingTitle,
                storeType,
                storeID,
                sgdbID,
            } = element;

            const uniqueTitle = ensureUniqueName(
                [...this.allGames.values()].map((g) => g.title),
                title,
            );

            const newGame = new GameObject({
                title: uniqueTitle,
                coverImageURL,
                coverThumbURL,
                coverIsOfficial: storeType === "steam",
                sortingTitle,
                storeType,
                storeID,
                sgdbID,
            });

            this.allGames.set(newGame.id, newGame);
        });
        return remoteGames.toAdd.length === 0 && remoteGames.toUpdate.latest.length === 0
            ? toastInfo("No Games to import.")
            : toastSuccess(
                  `Added ${remoteGames.toAdd.length} to games list. (${remoteGames.toSkip.length} skipped.)`,
              );
    }

    deleteGame(game) {
        const removed = this.allGames.delete(game.id);
        if (!removed) return toastError(`Failed to delete ${game.title} from games list`);

        for (const reminder of this.allReminders) {
            if (reminder.gameID === game.id) deleteItemFromArray(this.allReminders, reminder);
        }

        return toastSuccess(`Deleted ${game.title} from games list`);
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
        // Editing needs to be in the DataStore rather than the object itself, to prevent duplicate names
        if (!(game instanceof GameObject)) return toastError("Invalid game object: " + game);
        const storedGame = this.allGames.get(game.id);
        if (!storedGame) return toastError(`${game.title} does not exist in the games list`);
        if (!title || typeof title !== "string" || !title.trim())
            return toastError("Cannot save a game without a title");
        if (storeType !== "custom" && !storeID)
            return toastError(
                `Cannot save a ${storeTypes[storeType]} game without selecting it from its search`,
            );
        if (!coverImageURL) return toastError("Cannot save a game without a cover image");
        if (!coverThumbURL) return toastError("Cannot save a game without a cover thumbnail");

        const allGamesArray = [...this.allGames.values()];
        if (storeType !== "custom") {
            // Looking for a different GameObject that has the same storeID from the same storeType
            const identicalGame = allGamesArray.find(
                (g) => g.storeID === storeID && g.storeType === storeType && g.id !== game.id,
            );
            if (identicalGame) {
                return toastError(identicalGame.title + " already exists in the games list");
            }
        }
        if (title.toLowerCase() !== game.title.toLowerCase()) {
            title = ensureUniqueName(
                allGamesArray.map((g) => g.title),
                title,
            );
        }

        const oldTitle = storedGame.title;
        storedGame.title = title;
        storedGame.coverImageURL = coverImageURL;
        storedGame.coverThumbURL = coverThumbURL;
        storedGame.coverIsOfficial = coverIsOfficial;
        storedGame.sortingTitle = sortingTitle;
        storedGame.storeType = storeType;
        storedGame.storeID = storeID;
        storedGame.sgdbID = sgdbID;
        if (oldTitle !== title) return toastSuccess(`Updated ${oldTitle} to ${storedGame.title}`);
        else return toastSuccess(`Updated ${storedGame.title}`);
    }

    sortTagsByMethod(tagType, sortMethod, isDescending) {
        const entriesArray = [...this.allTags[tagType].entries()];
        entriesArray.sort(([, tag1], [, tag2]) => sortMethod(tag1, tag2));
        if (isDescending) entriesArray.reverse();

        // Needs to be runInAction because used by reaction, which seems to lose binding otherwise
        runInAction(() => this.allTags[tagType].replace(entriesArray));
    }

    sortTagsByCustomOrder(tagType, isDescending) {
        const orderArray = this.tagsCustomOrders[tagType];
        if (!(orderArray.length > 0)) {
            orderArray.push(...this.allTags[tagType].keys());
            return;
        } // if no custom order yet, make one from the current order

        const entriesArray = new Array(orderArray.length);
        for (const [i, tagID] of this.tagsCustomOrders[tagType].entries())
            entriesArray[i] = [tagID, this.allTags[tagType].get(tagID)];
        if (isDescending) entriesArray.reverse();

        runInAction(() => this.allTags[tagType].replace(entriesArray));
    }

    sortGamesByMethod(sortMethod, isDescending) {
        const entriesArray = [...this.allGames.entries()];
        entriesArray.sort(([, game1], [, game2]) => sortMethod(game1, game2));
        if (isDescending) entriesArray.reverse();

        // Needs to be runInAction because used by reaction, which seems to lose binding otherwise
        runInAction(() => this.allGames.replace(entriesArray));
    }

    #preImportList() {
        return { toAdd: [], toUpdate: { old: [], latest: [] }, toSkip: [] };
    }
}

const dataStore = new DataStore();
// Prefer to use the context version in components, for expanded functionality in the future
// but the global version is available for non-component uses
const DataStoreContext = createContext(dataStore);
export const useDataStore = () => useContext(DataStoreContext);
export const globalDataStore = dataStore;

// #==============#
// ‖ AUTO-SORTING ‖
// #==============#

// These handle auto-sorting on relevant changes, e.g. If sorting friends by name, react when any friend's name changes
const sortingReactions = {
    [tT.friend]: null,
    [tT.category]: null,
    [tT.status]: null,
    games: null,
};

// And these set the sorting reactions, by reacting to changes in the SettingsStore.
// DataStore imports SettingsStore already, so this avoids circular imports.
const sortBySettingsReaction = (tagType) =>
    reaction(
        () => [
            globalSettingsStore.tagSortMethods[tagType],
            globalSettingsStore.tagSortDirection[tagType],
        ],
        (sortBy) => setTagSorting(tagType, sortBy[0], sortBy[1]),
        { fireImmediately: true },
    );
sortBySettingsReaction(tT.friend);
sortBySettingsReaction(tT.category);
sortBySettingsReaction(tT.status);

reaction(
    () => [globalSettingsStore.gameSortMethod, globalSettingsStore.gameSortDirection],
    (sortBy) => setGameSorting(sortBy[0], sortBy[1]),
    { fireImmediately: true },
);

function setTagSorting(tagType, sortSetting, sortDirection) {
    sortingReactions[tagType]?.disable();
    const isDescending = sortDirection === "desc";

    if (sortSetting === "custom") {
        sortingReactions[tagType] = new SortingReaction(
            () => dataStore.tagsCustomOrders[tagType],
            () => dataStore.sortTagsByCustomOrder(tagType, isDescending),
        );
    } else if (sortSetting === "name") {
        sortingReactions[tagType] = new SortingReaction(
            () => [[...dataStore.allTags[tagType]].map(([, tag]) => tag.name)],
            () => dataStore.sortTagsByMethod(tagType, compareTagNamesAZ, isDescending),
        );
    } else if (sortSetting === "countFiltered") {
        sortingReactions[tagType] = new SortingReaction(
            () => [[...dataStore.allTags[tagType]].map(([, tag]) => tag.filteredGamesCount)],
            () => dataStore.sortTagsByMethod(tagType, compareTagFilteredGamesCount, isDescending),
        );
    } else if (sortSetting === "countTotal") {
        sortingReactions[tagType] = new SortingReaction(
            () => [[...dataStore.allTags[tagType]].map(([, tag]) => tag.totalGamesCount)],
            () => dataStore.sortTagsByMethod(tagType, compareTagTotalGamesCount, isDescending),
        );
    }
    sortingReactions[tagType]?.enable();
}

function setGameSorting(sortSetting, sortDirection) {
    sortingReactions.games?.disable();
    const isDescending = sortDirection === "desc";

    if (sortSetting === "title") {
        sortingReactions.games = new SortingReaction(
            () => [[...dataStore.allGames].map(([, game]) => [game.title, game.sortingTitle])],
            () => {
                dataStore.sortGamesByMethod(compareGameTitlesAZ, isDescending);
            },
        );
    }
    sortingReactions.games?.enable();
}

// #=============#
// ‖ FILE BACKUP ‖
// #=============#

export function ExportDataStoreToJSON() {
    return {
        [storageKeys[tT.friend]]: dataStore.allTags[tT.friend], // turning maps into arrays to stringify
        [storageKeys[tT.category]]: dataStore.allTags[tT.category],
        [storageKeys[tT.status]]: dataStore.allTags[tT.status],
        [storageKeys.games]: dataStore.allGames,
        [storageKeys.reminders]: dataStore.allReminders,
        [storageKeys.settings]: loadFromStorage(storageKeys.settings, {}),
        [storageKeys.defaultFilters]: loadFromStorage(storageKeys.defaultFilters, {}),
        [storageKeys.version]: version,
        [storageKeys.tagsCustomOrders]: dataStore.tagsCustomOrders,
    };
}

export function backupToFile() {
    console.log("Backing up data to file...");
    const data = ExportDataStoreToJSON();
    const { userInfo } = userStore;

    const blob = new Blob([JSON.stringify(data, null, 4)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const timestamp = new Date().toISOString().split(".")[0].replace("T", " ").replaceAll(":", "-");
    a.href = url;
    a.download = ["Playfrens", userInfo.displayName, timestamp].filter(Boolean).join(" ") + ".json";
    a.click();
    URL.revokeObjectURL(url);
}

export function restoreFromFile(file) {
    console.log("Restoring data from file...");
    const reader = new FileReader();
    reader.onload = action(async function (e) {
        const data = JSON.parse(e.target.result.toString());
        // Populate the DataStore's Tags and Games. They're then localstorage-synced by the reactions.
        const tagCollection = {
            [tT.friend]: data[storageKeys[tT.friend]],
            [tT.category]: data[storageKeys[tT.category]],
            [tT.status]: data[storageKeys[tT.status]],
        };
        dataStore.populateTags(tagCollection);
        await dataStore.populateGames(data[storageKeys.games], data[storageKeys.version]);
        dataStore.populateReminders(data[storageKeys.reminders]);
        dataStore.populateTagsCustomOrders(data[storageKeys.tagsCustomOrders]);
        // Load the settings to localstorage, and reload, which also populates the SettingsStore
        saveToStorage(storageKeys.settings, data[storageKeys.settings]);
        saveToStorage(storageKeys.defaultFilters, data[storageKeys.defaultFilters]);

        saveBoard(ExportDataStoreToJSON())
            .then(() => {
                window.location.reload();
            })
            .catch((error) => {
                toastError("Failed to save data to server: " + error.message);
            });
    });
    reader.readAsText(file);
}

// #==========================#
// ‖ FIRST VISIT DEFAULT TAGS ‖
// #==========================#
function defaultTagsSample() {
    return {
        [tT.friend]: [],
        [tT.category]: ["Playthrough", "Round-based", "Persistent World"],
        [tT.status]: [
            "Playing",
            "Play Anytime",
            "LFG",
            "Paused",
            "Backlog",
            "Abandoned",
            "Finished",
        ],
    };
}

const firstVisit = loadFromStorage(storageKeys.visited, false) === false;

if (firstVisit && dataStore.allGames.size === 0) {
    const sample = defaultTagsSample();
    dataStore.populateTagsFromTagNames(sample);
    saveToStorage(storageKeys.visited, true);
}
saveToStorage(storageKeys.version, version);
