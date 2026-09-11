import { runInAction } from "mobx";
import { FriendTagObject, TagObject } from "@/models";
import {
    deleteItemFromArray,
    ensureUniqueName,
    moveItemInArray,
    setToastSilence,
    shouldUpdateObject,
    toastError,
    toastInfo,
    toastSuccess,
    updateObject,
} from "@/Utils";
import { tT } from "./constants.js";

function preImportList() {
    return { toAdd: [], toUpdate: { old: [], latest: [] }, toSkip: [] };
}

// Used when loading some predefined set, like the starting defaults
export function populateTagsFromTagNames(store, tagCollection) {
    for (const tagType in tagCollection) {
        // .replace() mutates instead of swapping, otherwise will break a lot of things
        store.allTags[tagType].replace(
            tagCollection[tagType]
                .filter(Boolean) // skip potential nulls, undefined, "" etc.
                .map((tagName) => new TagObject({ type: tagType, name: tagName }))
                .map((tag) => [tag.id, tag]),
        );
    }
}

/** @param {{[key: string]: any[]}} tagCollection - object holding, per tagType, an array of [id, serialized TagObject] entries */
export function populateTags(store, tagCollection) {
    for (const tagType in tagCollection) {
        store.allTags[tagType].replace(
            tagCollection[tagType]
                .filter(Boolean)
                .map(([id, tagJson]) => [
                    id,
                    new (tagType === "friend" ? FriendTagObject : TagObject)(tagJson),
                ]),
        );
    }
}

export function getTagByID(store, id, tagType = null) {
    if (tagType) return store.allTags[tagType].get(id);
    // as there's only a few tagTypes, and Map.get is O(1), this remains O(1)
    for (const tagMap in Object.values(store.allTags)) {
        const tag = tagMap.get(id);
        if (tag) return tag;
    }
    return null;
}

export function addTag(store, tag) {
    if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
    const fullList = store.allTags[tag.type];

    if ([...fullList.values()].some((t) => t.id === tag.id))
        return toastError(`This tag already exists in the ${tag.typeStrings.plural} list`);

    tag.name = ensureUniqueName(
        [...fullList.values()].map((t) => t.name),
        tag.name,
    );

    fullList.set(tag.id, tag);
    const orderList = store.tagsCustomOrders[tag.type];
    if (orderList && orderList.length > 0) orderList.push(tag.id); // if Custom Sort was ever selected, thus an order was made
    return toastSuccess(`Added ${tag.name} to ${tag.typeStrings.plural} list`);
}

// Flags which needs to be added, updated or skipped.
export function preImportFriends(store, remoteFriends) {
    const list = preImportList();
    const currentFriendList = [...store.allTags[tT.friend].values()];
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
export function importFriends(store, remoteFriends) {
    setToastSilence(true);
    const { old, latest } = remoteFriends.toUpdate;
    for (let i = 0; i < old.length && i < latest.length; i++)
        updateObject(old[i], { iconURL: latest[i].iconURL });
    const toAdd = remoteFriends.toAdd;
    toAdd.forEach((element) => {
        addTag(store, element);
    });
    setToastSilence(false);
    return remoteFriends.toAdd.length === 0 && remoteFriends.toUpdate.latest.length === 0
        ? toastInfo("Friends data is up to date.")
        : toastSuccess(
              `Added ${remoteFriends.toAdd.length} to friend list. (${remoteFriends.toUpdate.latest.length} updated, ${remoteFriends.toSkip.length} skipped.)`,
          );
}

export function deleteTag(store, tag) {
    if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
    if (!store.allTags[tag.type].has(tag.id))
        return toastError(`${tag.name} does not exist in ${tag.typeStrings.plural} list`);

    store.allGames.forEach((game) => game.silentRemoveTag(tag));
    store.allTags[tag.type].delete(tag.id);
    deleteItemFromArray(store.tagsCustomOrders[tag.type], tag.id);
    return toastSuccess(`Deleted ${tag.name} from ${tag.typeStrings.plural} list`);
}

export function oldEditTag(store, tag, { newName }) {
    if (tag.name === newName) return true; // nothing to do here, until adding more fields to edit
    // Editing needs to be in the DataStore rather than the object itself, to prevent duplicate names
    if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
    const fullList = store.allTags[tag.type];
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

export function editTag(store, tag, data = {}) {
    if (!(tag instanceof TagObject)) return toastError("Invalid tag object: " + tag);
    const fullList = store.allTags[tag.type];
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

export function allTagsFlatForEach(store, callbackfn) {
    for (const tagType in store.allTags) store.allTags[tagType].forEach(callbackfn);
}

export function updateAllTagTotalGamesCounters(store) {
    allTagsFlatForEach(
        store,
        (t) =>
            (t.totalGamesCount = [...store.allGames.values()].filter((game) =>
                game.hasTag(t),
            ).length),
    );
}

export function updateTagTotalGamesCounter(store, tag) {
    const t = store.allTags[tag.type].get(tag.id);
    t.totalGamesCount = [...store.allGames.values()].filter((game) => game.hasTag(t)).length;
}

/** @param {(game: GameObject, tag: TagObject) => boolean} doesGameQualifyForTag - also know as FilterStore.doesGameQualifyForTag */
export function updateAllTagFilteredGamesCounters(store, doesGameQualifyForTag) {
    allTagsFlatForEach(
        store,
        (t) =>
            (t.filteredGamesCount = [...store.allGames.values()].filter((game) =>
                doesGameQualifyForTag(game, t),
            ).length),
    );
}

/** @param {(game: GameObject, tag: TagObject) => boolean} doesGameQualifyForTag - used whenever adding/removing a tag from a game. not the prettiest, but is efficient */
export function updateTagFilteredGamesCounter(store, tag, doesGameQualifyForTag) {
    const t = store.allTags[tag.type].get(tag.id);
    t.filteredGamesCount = [...store.allGames.values()].filter((game) =>
        doesGameQualifyForTag(game, t),
    ).length;
}

export function populateTagsCustomOrders(store, tagOrderJsons) {
    store.tagsCustomOrders = {
        [tT.friend]: [],
        [tT.category]: [],
        [tT.status]: [],
    };
    if (typeof tagOrderJsons !== "object") return console.warn("Skipping invalid tagOrderJsons.");
    if (Object.keys(tagOrderJsons).length === 0)
        return console.warn("Skipping empty tagOrderJsons.");
    store.tagsCustomOrders = tagOrderJsons;
}

export function moveTagCustomPosition(store, tagDragged, tagDroppedOn, direction) {
    const validTagsToReposition =
        tagDragged &&
        tagDroppedOn &&
        tagDragged instanceof TagObject &&
        tagDroppedOn instanceof TagObject &&
        tagDragged.type === tagDroppedOn.type;
    if (!validTagsToReposition)
        return console.warn(`Invalid tag reposition, tags: ${tagDragged}, ${tagDroppedOn}`);

    const orderArray = store.tagsCustomOrders[tagDragged.type];
    const indexDragged = orderArray.indexOf(tagDragged.id);
    const indexDroppedOn = orderArray.indexOf(tagDroppedOn.id);
    const indexToGoTo = indexDroppedOn + (direction === "bottom" ? 1 : 0);
    moveItemInArray(orderArray, indexDragged, indexToGoTo);
    store.tagsCustomOrders[tagDragged.type] = [...orderArray]; // triggers reaction
}

export function isDraggedTagDropzoneNotOnSelf(store, tagDragged, tagDraggedOver, direction) {
    // If dragging a tag during custom-sort rearrangement, and you're hovering on the top of the neighbor tag right below you, this lets you know there's no need to show an effect
    const validTagsToCheck =
        tagDragged &&
        tagDraggedOver &&
        tagDragged instanceof TagObject &&
        tagDraggedOver instanceof TagObject &&
        tagDragged.type === tagDraggedOver.type;
    if (!validTagsToCheck) return;

    const orderArray = store.tagsCustomOrders[tagDragged.type];
    const indexDragged = orderArray.indexOf(tagDragged.id);
    const indexDraggedOver = orderArray.indexOf(tagDraggedOver.id);
    const indexToGoTo = indexDraggedOver + (direction === "bottom" ? 1 : 0);

    return !(indexToGoTo === indexDragged || indexToGoTo === indexDragged + 1); // +1 is also self because of the shifting array calculation. -1 isn't.
}

export function sortTagsByMethod(store, tagType, sortMethod, isDescending) {
    const entriesArray = [...store.allTags[tagType].entries()];
    entriesArray.sort(([, tag1], [, tag2]) => sortMethod(tag1, tag2));
    if (isDescending) entriesArray.reverse();

    // Needs to be runInAction because used by reaction, which seems to lose binding otherwise
    runInAction(() => store.allTags[tagType].replace(entriesArray));
}

export function sortTagsByCustomOrder(store, tagType, isDescending) {
    const orderArray = store.tagsCustomOrders[tagType];
    if (!(orderArray.length > 0)) {
        orderArray.push(...store.allTags[tagType].keys());
        return;
    } // if no custom order yet, make one from the current order

    const entriesArray = orderArray
        .map((tagID) => [tagID, store.allTags[tagType].get(tagID)])
        .filter(([, tag]) => tag !== undefined);
    if (isDescending) entriesArray.reverse();

    runInAction(() => store.allTags[tagType].replace(entriesArray));
}

