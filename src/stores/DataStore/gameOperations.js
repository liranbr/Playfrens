import { runInAction } from "mobx";
import { saveBoard, getOfficialCoverImageURLs } from "@/APIUtils.js";
import { GameObject, storeTypes } from "@/models";
import { deserializePartyTagIDs, Party } from "@/models/GameObject.js";
import { globalSettingsStore } from "@/stores";
import {
    coverToThumb,
    deleteItemFromArray,
    ensureUniqueName,
    toastError,
    toastInfo,
    toastSuccess,
} from "@/Utils";
import { ExportDataStoreToJSON } from "./backupRestore.js";

function preImportList() {
    return { toAdd: [], toUpdate: { old: [], latest: [] }, toSkip: [] };
}

function parseParties(parties) {
    return (parties ?? [])
        .filter((party) => {
            if (!party || !party.id || !party.name) {
                console.warn(`Skipping invalid party, id: ${party?.id}`);
                return false;
            }
            return true;
        })
        .map((party) => new Party({ ...party, tagIDs: deserializePartyTagIDs(party.tagIDs) }));
}

export function gameFromJson(gameJson) {
    return new GameObject({ ...gameJson, parties: parseParties(gameJson.parties) });
}

/**
 * Refreshes official store covers for games flagged coverIsOfficial.
 * @param {[string, GameObject][]} entries
 * @returns {Promise<boolean>} true if any cover was changed
 */
async function refreshOfficialCovers(entries) {
    // Disabled due to the HUGE performance issue.
    return false;
    // eslint-disable-next-line no-unreachable
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

// eslint-disable-next-line no-unused-vars -- unused, kept for future use case.
export async function populateGames(store, gameJsons, version) {
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
                return [id, gameFromJson(gameJson)];
            }),
    );

    changed = (await refreshOfficialCovers(entries)) || changed;

    runInAction(() => {
        store.allGames.replace(entries); // mutate in place, don't reassign the Map
        if (changed) {
            // Runs on nearly every load if a game was missing a cached thumbnail, so keep
            // #boardLastUpdated in sync or the next edit gets wrongly flagged as stale.
            saveBoard(store.activeBoardId, ExportDataStoreToJSON(store))
                .then((saved) => {
                    if (saved?.lastUpdated) store.setBoardLastUpdated(saved.lastUpdated);
                })
                .catch(() => {});
        }
    });
}

export function addGame(
    store,
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
    const allGamesArray = [...store.allGames.values()];

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
    if (store.allGames.has(newGame.id))
        throw new Error(`What do you MEAN this uuid (${newGame.id}) already exists`);
    store.allGames.set(newGame.id, newGame);
    toastSuccess("Added " + title + " to games list");
    return newGame; // used to open the GamePage right after adding the game
}

export function preImportSteamGames(store, remoteGames) {
    const list = preImportList();
    const currentGameList = [...store.allGames.values()];
    const allowExplicitContent = globalSettingsStore.showMatureContent === "on";
    list.hiddenByContentSettings = 0;
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

        if (gameExists) {
            list.toSkip.push(remoteGame);
        } else if (remoteGame.isAdult && !allowExplicitContent) {
            // Board settings disallow adding explicit content entirely, hidden and disintegrated into ashes.
            list.hiddenByContentSettings++;
        } else {
            list.toAdd.push(remoteGame);
        }
    }

    return list;
}

/**
 * Call preImportSteamGames before calling this function to get the list
 * Add/Skip Games using a list of sorted remote game objects
 * @param {{ toAdd: object[], toUpdate: {old: object[], latest: object[]}, toSkip: object[] }} remoteGames
 */
export function importSteamGames(store, remoteGames) {
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
            isAdult,
        } = element;

        const uniqueTitle = ensureUniqueName(
            [...store.allGames.values()].map((g) => g.title),
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
            isAdult,
        });

        store.allGames.set(newGame.id, newGame);
    });
    return remoteGames.toAdd.length === 0 && remoteGames.toUpdate.latest.length === 0
        ? toastInfo("No Games to import.")
        : toastSuccess(
              `Added ${remoteGames.toAdd.length} to games list. (${remoteGames.toSkip.length} skipped.)`,
          );
}

export function deleteGame(store, game) {
    const removed = store.allGames.delete(game.id);
    if (!removed) return toastError(`Failed to delete ${game.title} from games list`);

    for (const reminder of store.allReminders) {
        if (reminder.gameID === game.id) deleteItemFromArray(store.allReminders, reminder);
    }

    return toastSuccess(`Deleted ${game.title} from games list`);
}

export function editGame(
    store,
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
    const storedGame = store.allGames.get(game.id);
    if (!storedGame) return toastError(`${game.title} does not exist in the games list`);
    if (!title || typeof title !== "string" || !title.trim())
        return toastError("Cannot save a game without a title");
    if (storeType !== "custom" && !storeID)
        return toastError(
            `Cannot save a ${storeTypes[storeType]} game without selecting it from its search`,
        );
    if (!coverImageURL) return toastError("Cannot save a game without a cover image");
    if (!coverThumbURL) return toastError("Cannot save a game without a cover thumbnail");

    const allGamesArray = [...store.allGames.values()];
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

export function sortGamesByMethod(store, sortMethod, isDescending) {
    const entriesArray = [...store.allGames.entries()];
    entriesArray.sort(([, game1], [, game2]) => sortMethod(game1, game2));
    if (isDescending) entriesArray.reverse();

    // Needs to be runInAction because used by reaction, which seems to lose binding otherwise
    runInAction(() => store.allGames.replace(entriesArray));
}

