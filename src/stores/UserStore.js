import { createContext, useContext } from "react";
import { makeAutoObservable, runInAction } from "mobx";
import { defaultFiltersStorageKey, globalDataStore, globalFilterStore } from "@/stores";
import { loadFromStorage } from "@/Utils.jsx";

export class UserStore {
    /**
     * Only public profile details
     * @type {{ provider: string, id: string, displayName: string, avatar: string }}
     */
    userInfo = undefined;

    constructor() {
        makeAutoObservable(this);
        this.getUser();
    }

    async getUser() {
        // DataStore.populate loads the board, which the default filters are then loaded from
        const populateStores = () =>
            globalDataStore
                .populate()
                .then(() =>
                    globalFilterStore.populate(loadFromStorage(defaultFiltersStorageKey, {})),
                );

        try {
            const res = await fetch("/auth/me", { credentials: "include" });
            // No content? Pass
            if (!res.ok || res.status == 204) {
                res.status == 204 &&
                    console.info("No Content: Skipping user data — no active login.");
                runInAction(() => {
                    this.userInfo = undefined;
                    populateStores();
                });
                return;
            }
            const data = await res.json();
            const user = data?.user;
            const info = {
                provider: user?.provider,
                id: user?.id,
                displayName: user?.display_name,
                avatar: user?.avatar_url,
            };
            runInAction(() => {
                this.userInfo = info;
                populateStores();
            });
        } catch (error) {
            console.error("Failed to get user data:", error);
        }
    }

    login(provider) {
        window.open(`/auth/${provider}`, "_self");
    }
    logout() {
        window.open("/auth/logout", "_self");
    }
}

export const userStore = new UserStore();
const UserStoreContext = createContext(userStore);
export const useUserStore = () => useContext(UserStoreContext);
