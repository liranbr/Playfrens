import { createContext, useContext } from "react";
import { makeAutoObservable, runInAction } from "mobx";
import {
    defaultFiltersStorageKey,
    globalDataStore,
    globalFilterStore,
    globalSettingsStore,
    settingsStorageKey,
} from "@/stores";
import { HttpStatus, loadFromStorage } from "@/Utils";

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

        // Verify with the server whenever the tab becomes active again, since a cached tab
        // can still show as "logged in" state after a logout that happened elsewhere in the meantime.
        document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") this.getUser();
        });
        window.addEventListener("pageshow", (event) => {
            if (event.persisted) this.getUser();
        });

        // Catch session invalidation the moment any request discovers it, not just on focus.
        // Only reacts to the backend's own NOT_AUTHENTICATED code (see Response.sendUnauthenticated) -
        // other 401s (e.g. a private Steam profile in steam.js) carry a different code and are left alone.
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            if (response.status === HttpStatus.UNAUTHORIZED) {
                const body = await response
                    .clone()
                    .json()
                    .catch(() => null);
                if (body?.code === "NOT_AUTHENTICATED") {
                    runInAction(() => {
                        this.userInfo = undefined;
                    });
                }
            }
            return response;
        };
    }

    async getUser() {
        try {
            const res = await fetch("/auth/me", { credentials: "include" });
            // Invalid response, or '204 no content' = no user data, or '401 unauthorized'= for steam users
            if (
                !res.ok ||
                res.status === HttpStatus.NO_CONTENT ||
                res.status === HttpStatus.UNAUTHORIZED
            ) {
                throw new Error(res.statusText);
            }
            const data = await res.json();
            const user = data?.user;
            runInAction(() => {
                this.userInfo = {
                    provider: user?.provider,
                    id: user?.id,
                    displayName: user?.display_name,
                    // Proxied server-side (backend/routes/auth.js) instead of hotlinking the provider's
                    // URL directly. `u` just busts the browser cache on account switches.
                    avatar: user?.avatar_url ? `/auth/avatar?u=${user.id}` : null,
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
        // DataStore.populate loads the board, which the settings and default filters are then loaded from
        await globalDataStore.populate().then(() => {
            globalSettingsStore.populate(loadFromStorage(settingsStorageKey, {}));
            globalFilterStore.populate(loadFromStorage(defaultFiltersStorageKey, {}));
            globalDataStore.watchSettingsForBackendSync();
        });
    }

    login(provider) {
        window.open(`/auth/${provider}`, "_self");
    }
    logout() {
        window.open("/auth/logout", "_self");
    }

    async postAuth(path, body) {
        try {
            const res = await fetch(`/auth/email/${path}`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return { ok: false, error: data?.error || "Something went wrong." };
            return { ok: true, ...data };
        } catch {
            return { ok: false, error: "Could not reach the server." };
        }
    }

    async checkEmailExists(email) {
        return this.postAuth("exists", { email });
    }

    async signupWithEmail(email, password) {
        const result = await this.postAuth("signup", { email, password });
        if (result.ok && !result.confirmationRequired) {
            await this.getUser();
            await this.populateStores();
        }
        return result;
    }

    async loginWithEmail(email, password) {
        const result = await this.postAuth("login", { email, password });
        if (result.ok) {
            await this.getUser();
            await this.populateStores();
        }
        return result;
    }

    async sendMagicLink(email) {
        return this.postAuth("magic-link", { email });
    }

    async completeMagicLinkSession(accessToken) {
        const result = await this.postAuth("session", { access_token: accessToken });
        if (result.ok) {
            await this.getUser();
            await this.populateStores();
        }
        return result;
    }
}

export const userStore = new UserStore();
const UserStoreContext = createContext(userStore);
export const useUserStore = () => useContext(UserStoreContext);
