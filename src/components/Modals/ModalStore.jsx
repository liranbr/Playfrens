import { action, makeAutoObservable } from "mobx";

class ModalStore {
    modalStack = [];

    constructor() {
        makeAutoObservable(this);
        window.addEventListener("load", () => {
            this.modalFadeDuration = getComputedStyle(document.documentElement)
                .getPropertyValue("--modal-fade-duration")
                .replace("ms", "") || "0";
        });
    }

    open = (name, props = {}) => {
        if (this.currentModal) this.currentModal.open = false;
        this.modalStack.push({ name, props, open: true });
        console.log("just opened, Modal stack size: " + this.modalStack.length);
    };

    close = () => {
        if (this.previousModal) this.previousModal.open = true;
        this.currentModal.open = false;
        this.afterCloseAnimation(() => this.modalStack.pop());
    };

    // Useful when you don't want the previous one to open when closing current,
    // e.g., after deleting a game, close the confirmation modal and the game modal
    closeTwo = () => {
        if (!this.previousModal) {
            return console.warn("No two modals to close.");
        }
        this.currentModal.open = false;
        this.previousModal.open = false;
        this.afterCloseAnimation(() => {
            this.modalStack.pop();
            this.modalStack.pop();
        });
    };

    afterCloseAnimation = (callback) => {
        setTimeout(action(() => {
            callback();
            console.log("just closed, Modal stack size: " + this.modalStack.length);
        }), +this.modalFadeDuration);
    };

    get currentModal() {
        console.log("currentModal, Modal stack size: " + this.modalStack.length);
        return this.modalStack[this.modalStack.length - 1] || null;
    }

    get previousModal() {
        return this.modalStack[this.modalStack.length - 2] || null;
    }

    clearAll() {
        this.modalStack = [];
    }

}

export const modalStore = new ModalStore();