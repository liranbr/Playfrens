import { createContext, useContext } from "react";
import { makeAutoObservable, reaction } from "mobx";
import { TagObject, tagTypes } from "@/models";
import { defaultFiltersStorageKey, globalDataStore, globalSettingsStore } from "@/stores";
import { saveToStorage, toastSuccess } from "@/Utils";

class FilterStore {
    search = "";
    selectedTagIDs = {
        [tagTypes.friend]: new Set(),
        [tagTypes.category]: new Set(),
        [tagTypes.status]: new Set(),
    };
    excludedTagIDs = {
        [tagTypes.friend]: new Set(),
        [tagTypes.category]: new Set(),
        [tagTypes.status]: new Set(),
    };
    hoveredTag = null; // Used for tag-hover effects on game cards
    draggedTag = null; // Same for drag-and-drop effects

    constructor() {
        makeAutoObservable(this);
    }

    // Async populate outside the constructor because data comes from the userStore's loaded board
    async populate(defaultFilters = {}) {
        // If there are default filters to load, ensure that the tagIDs they hold are of tags that exist, and deserialize them (make a Set)
        if (Object.keys(defaultFilters).length > 0) {
            this.search = defaultFilters.search ?? this.search;
            for (const tagType in defaultFilters.selectedTagIDs) {
                this.selectedTagIDs[tagType] = new Set(
                    defaultFilters.selectedTagIDs[tagType].filter(
                        (tagID) => !!globalDataStore.getTagByID(tagID, tagType),
                    ),
                );
            }
            for (const tagType in defaultFilters.excludedTagIDs) {
                this.excludedTagIDs[tagType] = new Set(
                    defaultFilters.excludedTagIDs[tagType].filter(
                        (tagID) => !!globalDataStore.getTagByID(tagID, tagType),
                    ),
                );
            }
        }
    }

    resetFilters() {
        this.search = "";
        for (const key in this.selectedTagIDs) {
            this.selectedTagIDs[key].clear();
        }
        for (const key in this.excludedTagIDs) {
            this.excludedTagIDs[key].clear();
        }
    }

    saveDefaultFilters() {
        const defaultFilters = {
            search: this.search,
            selectedTagIDs: this.selectedTagIDs,
            excludedTagIDs: this.excludedTagIDs,
        };
        saveToStorage(defaultFiltersStorageKey, defaultFilters);
        globalDataStore.syncBoardKeyToBackend(defaultFiltersStorageKey, defaultFilters);
        toastSuccess("Saved Default Filters state");
    }

    resetDefaultFilters() {
        saveToStorage(defaultFiltersStorageKey, {});
        globalDataStore.syncBoardKeyToBackend(defaultFiltersStorageKey, {});
        toastSuccess("Default state was reset");
    }

    setSearch(searchValue) {
        this.search = searchValue || "";
    }

    validateTag(tag) {
        if (!(tag instanceof TagObject) || !globalDataStore.getTagByID(tag.id, tag.type)) {
            console.warn("Invalid tag object: ", tag);
            return false;
        }
        if (this.isTagSelected(tag) && this.isTagExcluded(tag)) {
            console.warn(`Tag "${tag.name}" is both selected and excluded.`);
            return false;
        }
        return true;
    }

    toggleTagSelection(tag) {
        if (!this.validateTag(tag)) return false;
        // is invalid if both selected and excluded somehow, so no need to check that again
        const selectionSet = this.selectedTagIDs[tag.type];
        const exclusionSet = this.excludedTagIDs[tag.type];
        // If excluded, remove exclusion
        if (exclusionSet.delete(tag.id)) return true;
        // Else toggle selection
        if (selectionSet.delete(tag.id)) return true;
        selectionSet.add(tag.id);
        return true;
    }

    toggleTagExclusion(tag) {
        if (!this.validateTag(tag)) return false;
        // is invalid if both selected and excluded somehow, so no need to check that again
        const selectionSet = this.selectedTagIDs[tag.type];
        const exclusionSet = this.excludedTagIDs[tag.type];
        // If excluded, remove exclusion
        if (exclusionSet.delete(tag.id)) return true;
        // Else exclude, whether was selected or not
        selectionSet.delete(tag.id);
        exclusionSet.add(tag.id);
        return true;
    }

    removeFiltersOfTag(tag) {
        this.selectedTagIDs[tag.type].delete(tag.id);
        this.excludedTagIDs[tag.type].delete(tag.id);
    }

    isTagSelected(tag) {
        return this.selectedTagIDs[tag.type].has(tag.id);
    }

    isTagExcluded(tag) {
        return this.excludedTagIDs[tag.type].has(tag.id);
    }

    doesPartyPassFilters(party) {
        for (const tagType in tagTypes) {
            const partyTagsSet = party.tagIDs[tagType];
            const exclusionSet = this.excludedTagIDs[tagType];
            if (!exclusionSet.isDisjointFrom(partyTagsSet)) {
                return false; // !isDisjointFrom = there is overlap = party contains an excluded tag
            }

            const selectionSet = this.selectedTagIDs[tagType];
            if (selectionSet.size) {
                const selectionLogic = globalSettingsStore.tagFilterLogic[tagType];
                if (selectionLogic === "AND" && !selectionSet.isSubsetOf(partyTagsSet)) {
                    return false;
                }
                if (selectionLogic === "OR" && selectionSet.isDisjointFrom(partyTagsSet)) {
                    return false;
                }
            }
        }
        return true;
    }

    doesGamePassFilters(game) {
        if (this.search && !game.title.toLowerCase().includes(this.search.toLowerCase()))
            return false;

        return game.parties.some((party) => this.doesPartyPassFilters(party));
    }

    /**
     * Similar to {@link doesGamePassFilters}, but also requires the matching party to have `tag`, so a
     * game isn't counted for `tag` just because an unrelated party pass the active filters.
     * @param {import("@/models").GameObject} game
     * @param {TagObject} tag
     * @returns {boolean}
     */
    doesGameQualifyForTag(game, tag) {
        if (this.search && !game.title.toLowerCase().includes(this.search.toLowerCase()))
            return false;

        return game.parties.some((party) => this.doesPartyPassFilters(party) && party.hasTag(tag));
    }

    /**
     * @returns GameObject[] - All games that pass the current filters
     */
    get filteredGames() {
        const allGameObjects = [...globalDataStore.allGames.values()];
        if (this.areFiltersActive)
            return allGameObjects.filter((game) => this.doesGamePassFilters(game));
        else return allGameObjects;
    }

    setHoveredTag(tag = null) {
        if (tag instanceof TagObject) this.hoveredTag = tag;
        else this.hoveredTag = null;
    }

    setDraggedTag(tag = null) {
        if (tag instanceof TagObject) {
            this.draggedTag = tag;
            this.setHoveredTag(null);
        } else this.draggedTag = null;
    }

    get areFiltersActive() {
        return (
            this.search ||
            Object.values(this.selectedTagIDs).some((set) => set.size > 0) ||
            Object.values(this.excludedTagIDs).some((set) => set.size > 0)
        );
    }
}

const filterStore = new FilterStore();
const FilterStoreContext = createContext(filterStore);
export const useFilterStore = () => useContext(FilterStoreContext);
export const globalFilterStore = filterStore;

// DataStore contains tags, that contain counters of 'how many currently filtered games contain me'
// filtered games is in the FilterStore, so this provides it to the DataStore, only when filteredGames/allGames changes
reaction(
    () => filterStore.filteredGames,
    () =>
        globalDataStore.updateAllTagFilteredGamesCounters((game, tag) =>
            filterStore.doesGameQualifyForTag(game, tag),
        ),
    { fireImmediately: true },
);
// and this is a wrapper function to update the other cases that can change this counter;
// used when adding/removing a tag from a game
export function updateTagBothGameCounters(tag) {
    globalDataStore.updateTagFilteredGamesCounter(tag, (game, t) =>
        filterStore.doesGameQualifyForTag(game, t),
    );
    globalDataStore.updateTagTotalGamesCounter(tag);
}
