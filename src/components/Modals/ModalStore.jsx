import { action, makeAutoObservable } from "mobx";

export const Modals = {
    EditData: "EditData",
    EditGame: "EditGame",
    Playfrens: "Playfrens",
    DeleteWarning: "DeleteWarning",
};

class ModalStore {
    modalStack = [];

    constructor() {
        makeAutoObservable(this);
        window.addEventListener("load", () => {
            this.modalFadeDuration =
                getComputedStyle(document.documentElement)
                    .getPropertyValue("--modal-fade-duration")
                    .replace("ms", "") || "0";
        });
    }

    open = (name, props = {}) => {
        if (!Modals.hasOwnProperty(name))
            return console.warn(`Unknown modal type: ${name}`);
        if (this.currentModal) this.currentModal.open = false;
        this.modalStack.push({ name, props, open: true });
    };

    close = () => {
        if (!this.currentModal) return console.warn("No modal to close.");
        if (this.previousModal) this.previousModal.open = true;
        this.currentModal.open = false;
        this.afterCloseAnimation(() => this.modalStack.pop());
    };

    insertPrevious = (name, props = {}) => {
        if (!Modals.hasOwnProperty(name))
            return console.warn(`Unknown modal type: ${name}`);
        if (!this.currentModal)
            return console.warn("No current modal to insert behind.");
        this.modalStack.splice(-1, 0, { name, props, open: false });
    };

    // Useful when you don't want the previous one to open when closing current,
    // e.g., after deleting a game, close the confirmation modal and the game modal
    closeTwo = () => {
        if (!(this.previousModal && this.currentModal)) {
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
        setTimeout(
            action(() => {
                callback();
            }),
            +this.modalFadeDuration,
        );
    };

    get currentModal() {
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
