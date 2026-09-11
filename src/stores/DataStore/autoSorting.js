import { reaction } from "mobx";
import {
    compareGameTitlesAZ,
    compareTagFilteredGamesCount,
    compareTagNamesAZ,
    compareTagTotalGamesCount,
} from "@/models";
import { globalSettingsStore } from "@/stores";
import { SortingReaction } from "../SortingReaction.js";
import { tT } from "./constants.js";

// These handle auto-sorting on relevant changes, e.g. If sorting friends by name, react when any
// friend's name changes. Wired up once, from DataStore.js, right after the singleton is created.
export function setupAutoSorting(store) {
    const sortingReactions = {
        [tT.friend]: null,
        [tT.category]: null,
        [tT.status]: null,
        games: null,
    };

    function setTagSorting(tagType, sortSetting, sortDirection) {
        sortingReactions[tagType]?.disable();
        const isDescending = sortDirection === "desc";

        switch (sortSetting) {
            case "custom":
                sortingReactions[tagType] = new SortingReaction(
                    () => store.tagsCustomOrders[tagType],
                    () => store.sortTagsByCustomOrder(tagType, isDescending),
                );
                break;
            case "name":
                sortingReactions[tagType] = new SortingReaction(
                    () => [[...store.allTags[tagType]].map(([, tag]) => tag.name)],
                    () => store.sortTagsByMethod(tagType, compareTagNamesAZ, isDescending),
                );
                break;
            case "countFiltered":
                sortingReactions[tagType] = new SortingReaction(
                    () => [[...store.allTags[tagType]].map(([, tag]) => tag.filteredGamesCount)],
                    () =>
                        store.sortTagsByMethod(tagType, compareTagFilteredGamesCount, isDescending),
                );
                break;
            case "countTotal":
                sortingReactions[tagType] = new SortingReaction(
                    () => [[...store.allTags[tagType]].map(([, tag]) => tag.totalGamesCount)],
                    () => store.sortTagsByMethod(tagType, compareTagTotalGamesCount, isDescending),
                );
                break;
        }
        sortingReactions[tagType]?.enable();
    }

    function setGameSorting(sortSetting, sortDirection) {
        sortingReactions.games?.disable();
        const isDescending = sortDirection === "desc";

        if (sortSetting === "title") {
            sortingReactions.games = new SortingReaction(
                () => [[...store.allGames].map(([, game]) => [game.title, game.sortingTitle])],
                () => {
                    store.sortGamesByMethod(compareGameTitlesAZ, isDescending);
                },
            );
        }
        sortingReactions.games?.enable();
    }

    // And these set the sorting reactions, by reacting to changes in the SettingsStore.
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
}

