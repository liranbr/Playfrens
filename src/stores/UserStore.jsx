import { createContext, useContext } from "react";
import { makeAutoObservable, runInAction } from "mobx";

export class UserStore {
    /**
    * Only public profile details
    * @type {{ provider: string, id: string, displayName: string, avatar: string[] }}
    */
    userInfo = undefined;

    constructor() {
        makeAutoObservable(this);
        this.getUser();
    }

    async getUser() {
        try {
            const res = await fetch("/auth/me", { credentials: "include" });
            if (!res.ok) {
                runInAction(() => {
                    this.userInfo = undefined;
                })
                return;
            }
            const data = await res.json();
            const user = data?.user;
            const info = {}
            info.provider = user?.provider;
            info.id = user?.id;
            info.displayName = user?.displayName;
            info.avatars = user?.photos.map(photo => (photo.value));
            runInAction(() => {
                this.userInfo = info;
            });
        } catch {
            console.error("Failed to get user data.")
        }
    }

    login(provider = "steam") { window.open(`/auth/${provider}`, "_self"); }
    logout() { window.open("/auth/logout", "_self"); }
}

export const userStore = new UserStore();
const UserStoreContext = createContext(userStore);
export const useUserStore = () => useContext(UserStoreContext);