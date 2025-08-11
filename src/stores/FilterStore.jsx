import { createContext, useContext } from "react";
import { makeAutoObservable } from "mobx";
import { tagTypes } from "@/models";
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
    hoveredTag = { tagType: null, tagName: null }; // Used for tag-hover effects on game cards
    draggedTag = { tagType: null, tagName: null }; // Same for drag-and-drop effects

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

    validateTag(tagType, tagName) {
        if (!globalDataStore.allTags[tagType.key].includes(tagName)) {
            console.warn(`Tag "${tagName}" is not a valid "${tagType.key}" tag.`);
            return false;
        }
        if (
            this.selectedTags[tagType.key].has(tagName) &&
            this.excludedTags[tagType.key].has(tagName)
        ) {
            console.warn(
                `Tag "${tagName}" of type "${tagType.key}" is both selected and excluded.`,
            );
            return false;
        }
        return true;
    }

    toggleTagSelection(tagType, tagName) {
        if (!this.validateTag(tagType, tagName)) {
            return false;
        }
        const selectionSet = this.selectedTags[tagType.key];
        const exclusionSet = this.excludedTags[tagType.key];
        if (exclusionSet.delete(tagName)) {
            return true;
        }
        if (selectionSet.has(tagName)) {
            return selectionSet.delete(tagName);
        }
        selectionSet.add(tagName);
        return true;
    }

    toggleTagExclusion(tagType, tagName) {
        if (!this.validateTag(tagType, tagName)) {
            return false;
        } // is invalid if both selected and excluded somehow, so no need to check again
        const selectionSet = this.selectedTags[tagType.key];
        const exclusionSet = this.excludedTags[tagType.key];
        // If excluded, remove exclusion
        if (exclusionSet.has(tagName)) {
            return exclusionSet.delete(tagName);
        }
        // Else exclude, whether was selected or not
        selectionSet.delete(tagName);
        exclusionSet.add(tagName);
        return true;
    }

    // TODO: Temporary, used simultaneously when deleting a tag from DataStore, should probably be a mobx reaction
    removeFiltersOfTag(tagType, tagName) {
        this.selectedTags[tagType.key].delete(tagName);
        this.excludedTags[tagType.key].delete(tagName);
    }

    // TODO: Temporary like above, until tag UUID implementation
    UpdateTagBandaid(tagType, oldTag, newTag) {
        if (this.selectedTags[tagType.key].delete(oldTag)) {
            this.selectedTags[tagType.key].add(newTag);
        }
        if (this.excludedTags[tagType.key].delete(oldTag)) {
            this.excludedTags[tagType.key].add(newTag);
        }
        return true;
    }

    isTagSelected(tagType, tagName) {
        return this.selectedTags[tagType.key]?.has(tagName) || false;
    }

    isTagExcluded(tagType, tagName) {
        return this.excludedTags[tagType.key]?.has(tagName) || false;
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
            const gameTags = tagTypes[tagTypeKey].gameTagsList(game);

            const exclusionSet = this.excludedTags[tagTypeKey];
            // If any excluded tag is present, game does not pass filters
            if (exclusionSet.size && gameTags.some((tag) => exclusionSet.has(tag))) return false;

            const selectionSet = this.selectedTags[tagTypeKey];
            // If selected tags are present, filter by the tag type's logic
            if (selectionSet.size) {
                // Logic per tag type (AND/OR) that's stored in the settings is converted to (every/some) methods and used to filter
                const filterMethod = filterMethods[settingsStore.tagFilterLogic[tagTypeKey]];
                if (![...selectionSet][filterMethod]((tag) => gameTags.includes(tag))) return false;
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

    setHoveredTag(tagType = null, tagName = null) {
        if (tagType && tagName) this.hoveredTag = { tagType: tagType, tagName: tagName };
        else this.hoveredTag = { tagType: null, tagName: null };
    }

    setDraggedTag(tagType = null, tagName = null) {
        if (tagType && tagName) this.draggedTag = { tagType: tagType, tagName: tagName };
        else this.draggedTag = { tagType: null, tagName: null };
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
