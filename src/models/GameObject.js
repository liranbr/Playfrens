import { makeAutoObservable } from "mobx";
import { toastSuccess, toastError, compareAlphaIgnoreCase } from "@/Utils.jsx";
import { TagObject, tagTypes } from "@/models";
import { v4 as randomUUID } from "uuid";

export const storeTypes = Object.freeze({
    steam: "Steam",
    gog: "GOG",
    xbox: "Xbox",
    egs: "Epic",
    bnet: "Battle.net",
    custom: "Other",
});

/**
 * @class
 * @property {string} id - A UUID identifier for the game object.
 * @property {string} title - The title of the game.
 * @property {string} coverImageURL - The path to the game's cover image file.
 * @property {string} coverThumbURL - The path to the game's cover thumbnail file.
 * @property {string} sortingTitle - The (optional) title used for sorting the game.
 * @property {string} storeType - Store that the game is from, options in storeTypes, like 'steam', 'gog'. Can be none.
 * @property {string} storeID - ID of the Game on its store.
 * @property {string} sgdbID - ID of the Game on SteamGridDB. Usually derived from storeType+ID, but can be independent.
 * @property {Party[]} parties - the Parties/Groups/Playthroughs in a game, each containing TagIDs, Note, Reminders etc.
 */
export class GameObject {
    title;
    coverImageURL = "/missing_game_cover.png";
    coverThumbURL = "/missing_game_cover.png";
    sortingTitle = "";
    storeType = "custom";
    storeID = "";
    sgdbID = "";
    parties = [new Party({ name: "Group 1" })];
    id; // UUID

    constructor({
        title,
        coverImageURL,
        coverThumbURL,
        sortingTitle,
        storeType,
        storeID,
        sgdbID,
        parties,
        id,
    }) {
        this.title = title;
        this.coverImageURL = coverImageURL ?? this.coverImageURL;
        this.coverThumbURL = coverThumbURL ?? this.coverThumbURL;
        this.sortingTitle = sortingTitle ?? this.sortingTitle;
        this.storeType = storeType ? storeType : this.storeType; // so that if empty, makes it the default "custom"
        this.storeID = storeID ?? this.storeID;
        this.sgdbID = sgdbID ?? this.sgdbID;
        this.parties = parties ?? this.parties;
        this.id = id ?? randomUUID();
        makeAutoObservable(this);
        this.parties.forEach((party) => (party.parent = this));
    }

    /**Checks if any party within this game contains the tag.
     * @returns {string} the ID of the first party found to have the tag, or an empty string if none do. */
    hasTag(tag) {
        for (const party of this.parties) if (party.hasTag(tag)) return party.id;
        return "";
    }

    createParty(name = "") {
        if (!name) name = `Group ${this.parties.length + 1}`;
        this.parties.push(new Party({ parent: this, name: name }));
        return toastSuccess("Group created");
    }

    deleteParty(id) {
        if (!id || typeof id !== "string") return toastError(`Unable to delete party ${id}`);
        const partyIndex = this.parties.findIndex((party) => party.id === id);
        this.parties.splice(partyIndex, 1);
        return toastSuccess("Group deleted");
    }

    getParty(id) {
        return this.parties.find((party) => party.id === id);
    }

    // used on all games when deleting a tag from the DataStore, to avoid spamming toasts
    silentRemoveTag(tag) {
        if (!(tag instanceof TagObject)) return console.error(`Invalid tag: ${tag}`);
        for (const party of this.parties) party.tagIDs[tag.type].delete(tag.id);
    }

    toString() {
        return `Game Title: ${this.title}, Game ID: ${this.id}, party amount: ${this.parties.length}`;
    }
}

export function compareGameTitlesAZ(a, b) {
    const titleA = a.sortingTitle || a.title;
    const titleB = b.sortingTitle || b.title;
    return compareAlphaIgnoreCase(titleA, titleB);
}

/**
 * Parties are like instances of a game, with their own tag collection. Each is a Tab in the Game Page.
 * GameObject starts off with one (no tabs visible), while those with multiple Parties/Groups/Playthroughs have more of these,
 * but the GameObject contains shared things like GameID, Cover Image etc.
 * @class
 * @property {GameObject} parent - the GameObject that contains this Party.
 * @property {string} name - The name of the party/group/playthrough.
 * @property {string} id - A UUID identifier for the party object.
 * @property {{[key: string]: Set<String>}} tagIDs - For each tagType, a set holds the game's contained tags by their ID
 * @property {string} note - A custom note for this game.
 */
export class Party {
    parent;
    name;
    tagIDs = {
        [tagTypes.friend]: new Set(),
        [tagTypes.category]: new Set(),
        [tagTypes.status]: new Set(),
    };
    note = "";
    id;

    constructor({ parent, name, tagIDs, note, id }) {
        Object.defineProperty(this, "parent", {
            value: parent,
            enumerable: false,
            writable: true,
        }); // GameObject reference is either provided or injected right after the game is made

        this.name = name;
        this.tagIDs = tagIDs ?? this.tagIDs;
        this.note = note ?? this.note;
        this.id = id ?? randomUUID();
        makeAutoObservable(this, { parent: false });
    }

    addTag(tag) {
        if (!(tag instanceof TagObject)) {
            console.error(`Invalid tag: ${tag}`);
            return false;
        }

        const tagIDsSet = this.tagIDs[tag.type];
        if (!tagIDsSet.has(tag.id)) {
            tagIDsSet.add(tag.id);
            return toastSuccess(
                `Added ${tag.name} as a ${tag.typeStrings.single} for ${this.gameTitleWithParty}`,
            );
        } else
            return toastError(
                `${tag.name} is already a ${tag.typeStrings.single} for ${this.gameTitleWithParty}`,
            );
    }

    removeTag(tag) {
        if (!(tag instanceof TagObject)) {
            console.error(`Invalid tag: ${tag}`);
            return false;
        }

        const tagIDsSet = this.tagIDs[tag.type];
        if (tagIDsSet.delete(tag.id)) {
            return toastSuccess(
                `Removed the ${tag.typeStrings.single} ${tag.name} from ${this.gameTitleWithParty}`,
            );
        } else
            return toastError(
                `${tag.name} is not a ${tag.typeStrings.single} for ${this.gameTitleWithParty}`,
            );
    }

    hasTag(tag) {
        if (!(tag instanceof TagObject)) {
            console.error(`Invalid tag: ${tag}`);
            return false;
        }
        return this.tagIDs[tag.type].has(tag.id);
    }

    setNote(note) {
        this.note = note;
    }

    setName(name) {
        if (!name || typeof name !== "string") return toastError("Invalid group name");

        const oldName = this.name;
        this.name = name;
        return toastSuccess("Renamed group " + oldName + " to " + this.name);
    }

    get gameTitle() {
        return this.parent?.title ?? "(unknown game)";
    }

    get gameTitleWithParty() {
        if (this.parent?.parties.length > 1) {
            return this.gameTitle + " (" + this.name + ")";
        } else return this.gameTitle;
    }
}
