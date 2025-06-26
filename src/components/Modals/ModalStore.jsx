import { action, makeAutoObservable } from "mobx";

class ModalStore {
    modalStack = [];

    constructor() {
        makeAutoObservable(this);
    }

    open = (name, props = {}) => {
        this.modalStack.push({ name, props, open: true });
        console.log("just opened, Modal stack size: " + this.modalStack.length);
    };

    close = () => {
        const modalFadeDuration = window.getComputedStyle(document.documentElement)
            .getPropertyValue("--modal-fade-duration").replace("ms", "");
        this.currentModal.open = false;
        console.log("just closed, Modal stack size: " + this.modalStack.length);
        setTimeout(action(() => {
            this.modalStack.pop();
        }), +modalFadeDuration);
    };

    get currentModal() {
        console.log("currentModal, Modal stack size: " + this.modalStack.length);
        return this.modalStack[this.modalStack.length - 1] || null;
    }

    clearAll() {
        this.modalStack = [];
    }

}

export const modalStore = new ModalStore();