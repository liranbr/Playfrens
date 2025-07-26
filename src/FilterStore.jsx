import { createContext, useContext } from "react";
import { makeAutoObservable } from "mobx";
import { tagTypes } from "./models/TagTypes.jsx";

class FilterStore {
    search = "";
    selectedTags = {
        [tagTypes.friend]: new Set(),
        [tagTypes.category]: new Set(),
        [tagTypes.status]: new Set(),
    };
    excludedTags = {
        [tagTypes.friend]: new Set(),
        [tagTypes.category]: new Set(),
        [tagTypes.status]: new Set(),
    };
    filterLogic = {
        [tagTypes.friend]: "AND",
        [tagTypes.category]: "OR",
        [tagTypes.status]: "OR",
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

    setSearch(search) {
        this.search = search;
    }

    validateTag(tagType, tag) {
        if (!tagType.allTagsList.includes(tag)) {
            console.warn(`Tag "${tag}" is not a valid "${tagType.key}" tag.`);
            return false;
        }
        if (this.selectedTags[tagType].has(tag) && this.excludedTags[tagType].has(tag)) {
            console.warn(`Tag "${tag}" of type "${tagType.key}" is both selected and excluded.`);
            return false;
        }
        return true;
    }

    toggleTagSelection(tagType, tag) {
        if (!this.validateTag(tagType, tag)) {
            return false;
        }
        const selectionSet = this.selectedTags[tagType];
        const exclusionSet = this.excludedTags[tagType];
        if (exclusionSet.has(tag)) {
            console.warn(`Cannot select "${tag}" because it is excluded.`);
            return false;
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
        const selectionSet = this.selectedTags[tagType];
        const exclusionSet = this.excludedTags[tagType];
        // If excluded, remove exclusion
        if (exclusionSet.has(tag)) {
            return exclusionSet.delete(tag);
        }
        // Else exclude, whether was selected or not
        selectionSet.delete(tag);
        exclusionSet.add(tag);
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
        for (const [tagType, exclusionSet] of Object.entries(this.excludedTags)) {
            if (exclusionSet.size) {
                const gameTags = tagType.gameTagsList(game);
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
        for (const [tagType, selectionSet] of Object.entries(this.selectedTags)) {
            if (selectionSet.size) {
                const gameTags = tagType.gameTagsList(game);
                const filterLogic = this.filterLogic[tagType]; // AND/OR filter logic
                if (!filterMethods[filterLogic](gameTags, [...selectionSet])) {
                    return false;
                }
            }
        }
    }
}
