import { createContext, useContext } from "react";
import { makeAutoObservable } from "mobx";
import { TagObject, tagTypes } from "@/models";
import { globalDataStore, globalSettingsStore } from "@/stores";

class FilterStore {
    search = "";
    selectedTags = {
        [tagTypes.friend.key]: new Set(),
        [tagTypes.category.key]: new Set(),
        [tagTypes.status.key]: new Set(),
    };
    excludedTags = {
        [tagTypes.friend.key]: new Set(),
        [tagTypes.category.key]: new Set(),
        [tagTypes.status.key]: new Set(),
    };
    hoveredTag = null; // Used for tag-hover effects on game cards
    draggedTag = null; // Same for drag-and-drop effects

    constructor() {
        makeAutoObservable(this);
    }

    resetFilters() {
        this.search = "";
        for (const key in this.selectedTags) {
            this.selectedTags[key].clear();
        }
        for (const key in this.excludedTags) {
            this.excludedTags[key].clear();
        }
    }

    setSearch(searchValue) {
        this.search = searchValue || "";
    }

    validateTag(tag) {
        if (!(tag instanceof TagObject) || !globalDataStore.allTags[tag.type.key].includes(tag)) {
            console.warn("Invalid tag object: ", tag);
            return false;
        }
        if (this.selectedTags[tag.type.key].has(tag) && this.excludedTags[tag.type.key].has(tag)) {
            console.warn(`Tag "${tag.name}" is both selected and excluded.`);
            return false;
        }
        return true;
    }

    toggleTagSelection(tag) {
        if (!this.validateTag(tag)) return false;

        const selectionSet = this.selectedTags[tag.type.key];
        const exclusionSet = this.excludedTags[tag.type.key];
        if (exclusionSet.delete(tag)) return true;
        if (selectionSet.delete(tag)) return true;
        selectionSet.add(tag);
        return true;
    }

    toggleTagExclusion(tag) {
        if (!this.validateTag(tag)) return false;
        // is invalid if both selected and excluded somehow, so no need to check that again
        const selectionSet = this.selectedTags[tag.type.key];
        const exclusionSet = this.excludedTags[tag.type.key];
        // If excluded, remove exclusion
        if (exclusionSet.delete(tag)) return true;
        // Else exclude, whether was selected or not
        selectionSet.delete(tag);
        exclusionSet.add(tag);
        return true;
    }

    // TODO: Temporary, used simultaneously when deleting a tag from DataStore, should probably be a mobx reaction
    removeFiltersOfTag(tag) {
        this.selectedTags[tag.type.key].delete(tag);
        this.excludedTags[tag.type.key].delete(tag);
    }

    isTagSelected(tag) {
        return this.selectedTags[tag.type.key]?.has(tag) || false;
    }

    isTagExcluded(tag) {
        return this.excludedTags[tag.type.key]?.has(tag) || false;
    }

    doesGamePassFilters(game) {
        if (this.search) {
            if (!game.title.toLowerCase().includes(this.search.toLowerCase())) {
                return false;
            }
        }

        const settingsStore = globalSettingsStore;
        const filterMethods = {
            AND: "every",
            OR: "some",
        };
        for (const tagTypeKey in tagTypes) {
            const gameTags = game.tagsList(tagTypes[tagTypeKey]);

            const exclusionSet = this.excludedTags[tagTypeKey];
            // If any excluded tag is present, game does not pass filters
            if (
                exclusionSet.size &&
                [...exclusionSet].some(
                    (excludedTag) => gameTags.some((gt) => gt.equals(excludedTag)), // It's alright that this code is messy, about to be replaced with better data structures
                )
            )
                return false;

            const selectionSet = this.selectedTags[tagTypeKey];
            // If selected tags are present, filter by the tag type's logic
            if (selectionSet.size) {
                // Logic per tag type (AND/OR) that's stored in the settings is converted to (every/some) methods and used to filter
                const filterMethod = filterMethods[settingsStore.tagFilterLogic[tagTypeKey]];
                if (
                    ![...selectionSet][filterMethod]((selectedTag) =>
                        gameTags.some((t) => t.equals(selectedTag)),
                    )
                )
                    return false;
            }
        }
        return true;
    }

    /**
     * @returns GameObject[] - All games that pass the current filters
     */
    get filteredGames() {
        return globalDataStore.allGames.filter((game) => this.doesGamePassFilters(game));
    }

    setHoveredTag(tag = null) {
        if (tag instanceof TagObject) this.hoveredTag = tag;
        else this.hoveredTag = null;
    }

    setDraggedTag(tag = null) {
        if (tag instanceof TagObject) this.draggedTag = tag;
        else this.draggedTag = null;
    }

    get areFiltersActive() {
        return (
            this.search ||
            Object.values(this.selectedTags).some((set) => set.size > 0) ||
            Object.values(this.excludedTags).some((set) => set.size > 0)
        );
    }
}

const filterStore = new FilterStore();
const FilterStoreContext = createContext(filterStore);
export const useFilterStore = () => useContext(FilterStoreContext);
