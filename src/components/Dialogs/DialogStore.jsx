import { action, makeAutoObservable } from "mobx";

export const Dialogs = {
    EditTag: "EditTag",
    EditGame: "EditGame",
    Playfrens: "Playfrens",
    DeleteWarning: "DeleteWarning",
};

class DialogStore {
    dialogStack = [];

    constructor() {
        makeAutoObservable(this);
        window.addEventListener("load", () => {
            this.dialogFadeDuration =
                getComputedStyle(document.documentElement)
                    .getPropertyValue("--dialog-fade-duration")
                    .replace("ms", "") || "0";
        });
    }

    open = (name, props = {}) => {
        if (!Dialogs.hasOwnProperty(name)) return console.warn(`Unknown dialog type: ${name}`);
        if (this.currentDialog) this.currentDialog.open = false;
        this.dialogStack.push({ name, props, open: true });
    };

    close = () => {
        if (!this.currentDialog) return console.warn("No dialog to close.");
        if (this.previousDialog) this.previousDialog.open = true;
        this.currentDialog.open = false;
        this.afterCloseAnimation(() => this.dialogStack.pop());
    };

    insertPrevious = (name, props = {}) => {
        if (!Dialogs.hasOwnProperty(name)) return console.warn(`Unknown dialog type: ${name}`);
        if (!this.currentDialog) return console.warn("No current dialog to insert behind.");
        this.dialogStack.splice(-1, 0, { name, props, open: false });
    };

    // Useful when you don't want the previous one to open when closing current,
    // e.g., after deleting a game, close the confirmation dialog and the game dialog
    closeTwo = () => {
        if (!(this.previousDialog && this.currentDialog)) {
            return console.warn("No two dialogs to close.");
        }
        this.currentDialog.open = false;
        this.previousDialog.open = false;
        this.afterCloseAnimation(() => {
            this.dialogStack.pop();
            this.dialogStack.pop();
        });
    };

    afterCloseAnimation = (callback) => {
        setTimeout(
            action(() => {
                callback();
            }),
            +this.dialogFadeDuration,
        );
    };

    get currentDialog() {
        return this.dialogStack[this.dialogStack.length - 1] || null;
    }

    get previousDialog() {
        return this.dialogStack[this.dialogStack.length - 2] || null;
    }

    clearAll() {
        this.dialogStack = [];
    }
}

export const dialogStore = new DialogStore();
