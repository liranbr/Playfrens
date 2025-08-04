import { action, makeAutoObservable } from "mobx";
import { EditTagDialog } from "./EditTagDialog.jsx";
import { EditGameDialog } from "./EditGameDialog.jsx";
import { GamePageDialog } from "./GamePageDialog.jsx";
import { DeleteWarningDialog } from "./DeleteWarningDialog.jsx";
import { SettingsDialog } from "./SettingsDialog.jsx";
import { AboutDialog } from "./AboutDialog.jsx";
import { List, Item } from 'linked-list'

export const Dialogs = {
    DeleteWarning: DeleteWarningDialog,
    EditTag: EditTagDialog,
    EditGame: EditGameDialog,
    Playfrens: GamePageDialog,
    Settings: SettingsDialog,
    About: AboutDialog,
};

class DialogList extends List {
    detachLast() {
        return this.size == 1 ? this.head.detach() : this.tail.detach();
    }
}

class DialogItem extends Item {
    constructor(value) {
        super()
        this.value = value;
    }

    toString() {
        return this.value
    }
}



class DialogStore {
    dialogStack = [];
    dialogList = new DialogList();

    constructor() {
        makeAutoObservable(this);
        window.addEventListener("load", () => {
            this.dialogFadeDuration =
                getComputedStyle(document.documentElement)
                    .getPropertyValue("--dialog-fade-duration")
                    .replace("ms", "") || "0";
        });
    }

    open = (dialog, props = {}) => {
        if (!this.isDialogValid(dialog)) return console.warn("Unknown Dialog passed:\n", dialog);
        if (this.currentDialog) this.currentDialog.open = false;
        this.dialogStack.push({ dialog, props, open: true });
        this.dialogList.append(new DialogItem({ dialog, props, open: true }));
    };

    close = () => {
        if (!this.currentDialog) return console.warn("No dialog to close.");
        if (this.previousDialog) this.previousDialog.open = true;
        this.currentDialog.open = false;
        this.afterCloseAnimation(() => {
            this.dialogList.detachLast();
            this.dialogStack.pop();
            console.log(this.dialogList.size, this.dialogList);
        });

    };

    insertPrevious = (dialog, props = {}) => {
        if (!this.isDialogValid(dialog)) return console.warn("Unknown Dialog passed:\n", dialog);
        if (!this.currentDialog) return console.warn("No current dialog to insert behind.");
        this.dialogStack.splice(-1, 0, { dialog, props, open: false });
    };

    closePrevious = () => {
        if (!this.previousDialog) return console.warn("No previous dialog to detach from the stack!");
        if (!this.currentDialog) return console.warn("No current dialog in the stack.");
        this.afterCloseAnimation(() => this.dialogStack.splice(-2, 1));
    }

    // Useful when you don't want the previous one to open when closing current,
    // e.g., after deleting a game, close the confirmation dialog and the game dialog
    closeTwo = () => {
        if (!(this.previousDialog && this.currentDialog)) {
            return console.warn("No two dialogs to close.");
        }
        this.currentDialog.open = false;
        this.previousDialog.open = false;
        this.afterCloseAnimation(() => {
            this.dialogStack.splice(-2, 2)
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

    isDialogValid(dialog) {
        return Object.values(Dialogs).includes(dialog);
    }
}

export const dialogStore = new DialogStore();
