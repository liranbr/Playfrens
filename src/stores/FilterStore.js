import { createContext, useContext } from "react";
import { makeAutoObservable, reaction } from "mobx";
import { TagObject, tagTypes } from "@/models";
import { defaultFiltersStorageKey, globalDataStore, globalSettingsStore } from "@/stores";
import { loadFromStorage, saveToStorage, toastSuccess } from "@/Utils.jsx";

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

    constructor(defaultFilters = {}) {
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
        makeAutoObservable(this);
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
        saveToStorage(defaultFiltersStorageKey, {
            search: this.search,
            selectedTagIDs: this.selectedTagIDs,
            excludedTagIDs: this.excludedTagIDs,
        });
        toastSuccess("Saved Default Filters state");
    }

    resetDefaultFilters() {
        saveToStorage(defaultFiltersStorageKey, {});
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
        if (this.search) {
            if (!game.title.toLowerCase().includes(this.search.toLowerCase())) {
                return false;
            }
        }

        return game.parties.some((party) => this.doesPartyPassFilters(party));
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

const storedDefaultFilters = loadFromStorage(defaultFiltersStorageKey, {});
const filterStore = new FilterStore(storedDefaultFilters);
const FilterStoreContext = createContext(filterStore);
export const useFilterStore = () => useContext(FilterStoreContext);

// DataStore contains tags, that contain counters of 'how many currently filtered games contain me'
// filtered games is in the FilterStore, so this provides it to the DataStore, only when filteredGames/allGames changes
reaction(
    () => filterStore.filteredGames,
    (filteredGames) => globalDataStore.updateAllTagFilteredGamesCounters(filteredGames),
    { fireImmediately: true },
);
// and this is a wrapper function to update the other cases that can change this counter;
// used when adding/removing a tag from a game
export function updateTagBothGameCounters(tag) {
    globalDataStore.updateTagFilteredGamesCounter(tag, filterStore.filteredGames);
    globalDataStore.updateTagTotalGamesCounter(tag);
}
