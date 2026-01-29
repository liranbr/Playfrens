import { createContext, useContext } from "react";
import { makeAutoObservable, runInAction } from "mobx";
import { defaultFiltersStorageKey, globalDataStore, globalFilterStore } from "@/stores";
import { loadFromStorage } from "@/Utils.jsx";

export class UserStore {
    /**
     * Only public profile details
     * @type {{ provider: string, id: string, displayName: string, avatar: string, createdAt: Date }}
     */
    userInfo = undefined;
    loading = true;

    constructor() {
        makeAutoObservable(this);
        this.getUser()
            .then(() => this.populateStores())
            .then(() =>
                runInAction(() => {
                    this.loading = false;
                }),
            );
    }

    async getUser() {
        try {
            const res = await fetch("/auth/me", { credentials: "include" });
            // Invalid response, or '204 no content' = no user data
            if (!res.ok || res.status === 204) {
                throw new Error(res.statusText);
            }
            const data = await res.json();
            const user = data?.user;
            runInAction(() => {
                this.userInfo = {
                    provider: user?.provider,
                    id: user?.id,
                    displayName: user?.display_name,
                    avatar: user?.avatar_url,
                    createdAt: new Date(user?.created_at),
                };
            });
        } catch (error) {
            console.error("Failed to get user data:", error);
            runInAction(() => {
                this.userInfo = undefined;
            });
        }
    }

    async populateStores() {
        // DataStore.populate loads the board, which the default filters are then loaded from
        await globalDataStore
            .populate()
            .then(() => globalFilterStore.populate(loadFromStorage(defaultFiltersStorageKey, {})));
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
