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

    detachFirst() {
        return this.head?.detach();
    }

    detachLast() {
        return this.size == 0 ? null : this.size == 1 ? this.head.detach() : this.tail.detach();
    }

    getLast() {
        return this.size <= 1 ? this.head : this.tail;
    }
}

class DialogItem extends Item {

    constructor(value) {
        super()
        this.value = value;
    }

    print() {
        console.log("DialogItem:", this.value);
    }

    getAllValues() {
        let item = this.head
        const result = []

        while (item) {
            result.push(item.value)
            item = item.next
        }

        return result
    }

    get dialog() { return this.value.dialog; }
    get props() { return this.value.props; }
    get open() { return this.value.open; }
    set open(b) { this.value.open = b }
}



class DialogStore {

    dialogList = new DialogList();

    activeDialog = null;
    prevDialog = null;

    activeIsOpen = false;
    prevIsOpen = false;

    constructor() {
        makeAutoObservable(this);
        window.addEventListener("load", () => {
            const computedStyle = getComputedStyle(document.documentElement);
            this.dialogFadeDuration =
                computedStyle
                    .getPropertyValue("--dialog-fade-duration")
                    .replace("ms", "") || "0";
        });
    }

    open = (dialog, props = {}) => {
        if (!this.isDialogValid(dialog)) return console.warn("Unknown Dialog passed:\n", dialog);
        this.dialogList.append(new DialogItem({ dialog, props, open: false }));
        this.setActiveDialog(this.dialogList.getLast());
        this.doDialogTransition();
    };

    close = () => {
        console.log(this.activeDialog, this.activeIsOpen, this.prevIsOpen);
        this.doDialogTransition(true);
        this.onTransitionComplete(() => {
            this.dialogList.detachLast();
            this.setActiveDialog(this.dialogList.getLast());
            if (this.activeDialog)
                this.activeIsOpen = true;
        });

    };

    setActiveDialog = (dialogItem) => {
        this.activeDialog = dialogItem;
        this.prevDialog = dialogItem && dialogItem.prev ? dialogItem.prev : null;
    }

    doDialogTransition = (backwards = false, forcePrevClose = false) => {
        if (this.activeDialog) {
            this.activeDialog.open = !backwards;
            this.activeIsOpen = this.activeDialog.open;
        }
        else
            this.activeIsOpen = false;

        if (this.activeDialog.prev) {
            this.activeDialog.prev.open = backwards && !forcePrevClose;
            this.prevIsOpen = this.activeDialog.prev.open;
        }
        else
            this.prevIsOpen = false;
    }

    insertPrevious = (dialog, props = {}) => {
        const tail = this.dialogList.getLast();
        if (!tail) return;
        tail.prepend(new DialogItem({ dialog, props, open: false }));
        this.setActiveDialog(tail);
    }

    closePrevious = () => {
        const tail = this.dialogList.getLast();
        tail.prev && tail.prev.detach();
        this.prevDialog = null;
        this.setActiveDialog(tail);
    }

    // Useful when you don't want the previous one to open when closing current,
    // e.g., after deleting a game, close the confirmation dialog and the game dialog
    closeTwo = () => {
        const tail = this.activeDialog;
        this.doDialogTransition(true, true);
        if (this.activeDialog.prev) {
            this.activeDialog.prev.open = false;
            this.prevIsOpen = this.activeDialog.prev.open;
        }

        this.onTransitionComplete(() => {
            tail.prev?.detach();
            this.dialogList.detachLast();
            this.setActiveDialog(this.dialogList.getLast());
            if (this.activeDialog)
                this.activeIsOpen = true;
        });
    };

    closeMultiple = (amount) => {
        const last = this.activeDialog;
        this.doDialogTransition(true, true);

        // for while loop
        // let tail = last;
        // while (amount > 0 && tail.prev) {
        //     const prev = tail.prev;
        //     prev.open = false;
        //     this.prevIsOpen = this
        // }
        if (this.activeDialog.prev) {
            this.activeDialog.prev.open = false;
            this.prevIsOpen = this.activeDialog.prev.open;
        }

        this.onTransitionComplete(() => {
            tail.prev?.detach();
            this.dialogList.detachLast();
            this.setActiveDialog(this.dialogList.getLast());
            if (this.activeDialog)
                this.activeIsOpen = true;
        });
    }

    onTransitionComplete = (callback) => {
        setTimeout(
            action(() => {
                callback();
            }),
            +this.dialogFadeDuration
        );
    }

    clearAll() {
        this.activeDialog = null;
        this.prevDialog = null;
        this.activeIsOpen = false;
        this.prevIsOpen = false;
        this.dialogList = new DialogList();
    }

    isDialogValid(dialog) { return Object.values(Dialogs).includes(dialog); }
}

export const dialogStore = new DialogStore();
