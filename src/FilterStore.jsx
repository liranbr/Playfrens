import { createContext, useContext } from "react";
import { makeAutoObservable } from "mobx";
import { tagTypes } from "./models/TagTypes.jsx";
import { allGames } from "./DataStore.jsx";

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
    filterLogic = {
        [tagTypes.friend.key]: "AND",
        [tagTypes.category.key]: "OR",
        [tagTypes.status.key]: "OR",
    };

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

    validateTag(tagType, tag) {
        if (!tagType.allTagsList.includes(tag)) {
            console.warn(`Tag "${tag}" is not a valid "${tagType.key}" tag.`);
            return false;
        }
        if (this.selectedTags[tagType.key].has(tag) && this.excludedTags[tagType.key].has(tag)) {
            console.warn(`Tag "${tag}" of type "${tagType.key}" is both selected and excluded.`);
            return false;
        }
        return true;
    }

    toggleTagSelection(tagType, tag) {
        if (!this.validateTag(tagType, tag)) {
            return false;
        }
        const selectionSet = this.selectedTags[tagType.key];
        const exclusionSet = this.excludedTags[tagType.key];
        if (exclusionSet.delete(tag)) {
            return true;
        }
        if (selectionSet.has(tag)) {
            return selectionSet.delete(tag);
        }
        selectionSet.add(tag);
        return true;
    }

    toggleTagExclusion(tagType, tag) {
        if (!this.validateTag(tagType, tag)) {
            return false;
        } // is invalid if both selected and excluded somehow, so no need to check again
        const selectionSet = this.selectedTags[tagType.key];
        const exclusionSet = this.excludedTags[tagType.key];
        // If excluded, remove exclusion
        if (exclusionSet.has(tag)) {
            return exclusionSet.delete(tag);
        }
        // Else exclude, whether was selected or not
        selectionSet.delete(tag);
        exclusionSet.add(tag);
        return true;
    }

    // TODO: Temporary, used simultaneously when deleting a tag from DataStore, should probably be a mobx reaction
    removeFiltersOfTag(tagType, tag) {
        this.selectedTags[tagType.key].delete(tag);
        this.excludedTags[tagType.key].delete(tag);
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

    doesGamePassFilters(game) {
        // TODO: add fuzzy search matching
        if (this.search) {
            if (!game.title.toLowerCase().includes(this.search.toLowerCase())) {
                return false;
            }
        }

        // If any excluded tag is present, game does not pass filters
        for (const [tagTypeKey, exclusionSet] of Object.entries(this.excludedTags)) {
            if (exclusionSet.size) {
                const gameTags = tagTypes[tagTypeKey].gameTagsList(game);
                if (gameTags.some((tag) => exclusionSet.has(tag))) {
                    return false;
                }
            }
        }

        // If selected tags are present, check filter by logic
        const filterMethods = {
            AND: (gameTags, selectedTags) => selectedTags.every((tag) => gameTags.includes(tag)),
            OR: (gameTags, selectedTags) => selectedTags.some((tag) => gameTags.includes(tag)),
        };
        for (const [tagTypeKey, selectionSet] of Object.entries(this.selectedTags)) {
            if (selectionSet.size) {
                const gameTags = tagTypes[tagTypeKey].gameTagsList(game);
                const filterLogic = this.filterLogic[tagTypeKey]; // AND/OR filter logic
                if (!filterMethods[filterLogic](gameTags, [...selectionSet])) {
                    return false;
                }
            }
        }
        return true;
    }

    get filteredGames() {
        return allGames.filter((game) => this.doesGamePassFilters(game));
    }
}

const filterStore = new FilterStore();
const FilterStoreContext = createContext(filterStore);
export const useFilterStore = () => useContext(FilterStoreContext);
