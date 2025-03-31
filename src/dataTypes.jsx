import { allFriends, allCategories, allStatuses } from "./Store.jsx";

export const dataTypes = {
    friend: {
        key: "friend",
        single: "Friend",
        plural: "Friends",
        allDataList: allFriends,
        gameDataList: (game) => game.friends,
        add: (game, value) => game.addFriend(value),
        remove: (game, value) => game.removeFriend(value)
    },
    category: {
        key: "category",
        single: "Category",
        plural: "Categories",
        allDataList: allCategories,
        gameDataList: (game) => game.categories,
        add: (game, value) => game.addCategory(value),
        remove: (game, value) => game.removeCategory(value)
    },
    status: {
        key: "status",
        single: "Status",
        plural: "Status",
        allDataList: allStatuses,
        gameDataList: (game) => game.statuses,
        add: (game, value) => game.addStatus(value),
        remove: (game, value) => game.removeStatus(value)
    }
};