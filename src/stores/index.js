export {
    useSettingsStore,
    settingsKeyInStorage,
    TagHoverGameHighlightOptions,
    TagFilterLogicOptions,
    globalSettingsStore,
    TagSortOptions,
} from "./SettingsStore.jsx";

export {
    allFriends,
    allCategories,
    allStatuses,
    allGames,
    backupToFile,
    restoreFromFile,
    addTag,
    removeTag,
    editTag,
    addGame,
    removeGame,
} from "./DataStore.jsx";

export { useFilterStore, tagGameCount, sortTagsList } from "./FilterStore.jsx";

// important to initialize the 3 stores in this order to avoid uninitialized calls
