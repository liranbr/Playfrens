import { action, makeAutoObservable } from "mobx";
import { ChoosePartyToAddTagDialog } from "@/components/Dialogs/ChoosePartyToAddTagDialog.jsx";
import { AccountSettingsDialog } from "@/components/Dialogs/AccountSettingsDialog.jsx";
import { GenericWarningDialog } from "@/components/Dialogs/GenericWarningDialog.jsx";
import { DeleteWarningDialog } from "@/components/Dialogs/DeleteWarningDialog.jsx";
import { SteamImportDialog } from "@/components/Dialogs/SteamImportDialog.jsx";
import { EditGameDialog } from "@/components/Dialogs/EditGameDialog.jsx";
import { GamePageDialog } from "@/components/Dialogs/GamePageDialog.jsx";
import { SettingsDialog } from "@/components/Dialogs/SettingsDialog.jsx";
import { EditTagDialog } from "@/components/Dialogs/EditTagDialog.jsx";
import { AboutDialog } from "@/components/Dialogs/AboutDialog.jsx";
import { List, Item } from "linked-list";
import { parseDuration } from "@/Utils";

export const Dialogs = {
    ChoosePartyToAddTag: ChoosePartyToAddTagDialog,
    AccountSettings: AccountSettingsDialog,
    GenericWarning: GenericWarningDialog,
    DeleteWarning: DeleteWarningDialog,
    SteamImport: SteamImportDialog,
    EditGame: EditGameDialog,
    GamePage: GamePageDialog,
    Settings: SettingsDialog,
    EditTag: EditTagDialog,
    About: AboutDialog,
};

class DialogList extends List {
    detachFirst() {
        return this.head?.detach();
    }

    detachLast() {
        return this.size === 0 ? null : this.size === 1 ? this.head.detach() : this.tail.detach();
    }

    getLast() {
        return this.size <= 1 ? this.head : this.tail;
    }
}

class DialogItem extends Item {
    constructor(value) {
        super();
        this.value = value;
    }

    print() {
        console.log("DialogItem:", this.value);
    }

    getAllValues() {
        let item = this.head;
        const result = [];

        while (item) {
            result.push(item.value);
            item = item.next;
        }

        return result;
    }

    get dialog() {
        return this.value.dialog;
    }
    get props() {
        return this.value.props;
    }
    get open() {
        return this.value.open;
    }
    set open(b) {
        this.value.open = b;
    }
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

            this.dialogFadeDuration = parseDuration(
                computedStyle.getPropertyValue("--dialog-fade-duration"),
            );
        });
    }

    open = (dialog, props = {}) => {
        if (!this.isDialogValid(dialog)) return console.warn("Unknown Dialog passed:\n", dialog);
        this.dialogList.append(new DialogItem({ dialog, props, open: false }));
        this.setActiveDialog(this.dialogList.getLast());
        this.doDialogTransition();
    };

    close = () => {
        this.doDialogTransition(true);
        this.onTransitionComplete(() => {
            this.dialogList.detachLast();
            this.setActiveDialog(this.dialogList.getLast());
            if (this.activeDialog) this.activeIsOpen = true;
        });
    };

    setActiveDialog = (dialogItem) => {
        this.activeDialog = dialogItem;
        this.prevDialog = dialogItem?.prev ?? null;
    };

    doDialogTransition = (backwards = false, forcePrevClose = false) => {
        if (this.activeDialog) {
            this.activeDialog.open = !backwards;
            this.activeIsOpen = this.activeDialog.open;
        } else this.activeIsOpen = false;

        if (this.activeDialog.prev) {
            this.activeDialog.prev.open = backwards && !forcePrevClose;
            this.prevIsOpen = this.activeDialog.prev.open;
        } else this.prevIsOpen = false;
    };

    insertPrevious = (dialog, props = {}) => {
        const tail = this.dialogList.getLast();
        if (!tail) return;
        tail.prepend(new DialogItem({ dialog, props, open: false }));
        this.setActiveDialog(tail);
    };

    closePrevious = () => {
        const tail = this.dialogList.getLast();
        tail.prev && tail.prev.detach();
        this.prevDialog = null;
        this.setActiveDialog(tail);
    };

    // Useful when you don't want the previous one to open when closing current,
    // e.g., after deleting a game, close the confirmation dialog and the game dialog
    closeMultiple = (amount = 1) => {
        if (amount <= 0) {
            console.warn(
                ".closeMultiple(); called with 0 or less amount! Attempting to close only 1.",
            );
            amount = 1;
        }

        const tail = this.activeDialog;
        // Get the dialog we want to back track to, "null" means we are exiting till head and deactivate.
        const till = (() => {
            let node = tail;
            let i = amount;
            while (i > 0 && node) {
                node = node?.prev;
                i--;
            }
            return node;
        })();

        if (till) {
            while (till.next && till.next != tail) {
                const next = till.next;
                next.detach();
            }
            // referesh values now
            this.setActiveDialog(tail);
        }
        this.doDialogTransition(true, till != null);

        // manually clean the prev node of tail
        let prev = tail.prev;
        prev && (prev.open = false);
        this.prevIsOpen = false;

        // Clean up rest
        let i = amount - 1;
        while (i > 1 && prev) {
            prev.open = false;
            prev = prev.prev;
            i--;
        }

        // The dialog we want to go to so open!
        till && (till.open = true);

        this.onTransitionComplete(() => {
            tail.prev?.detach();
            this.dialogList.detachLast();
            this.setActiveDialog(this.dialogList.getLast());
            if (this.activeDialog) this.activeIsOpen = true;
        });
    };

    onTransitionComplete = (callback) => {
        setTimeout(
            action(() => {
                callback();
            }),
            +this.dialogFadeDuration,
        );
    };

    clearAll() {
        this.activeDialog = null;
        this.prevDialog = null;
        this.activeIsOpen = false;
        this.prevIsOpen = false;
        this.dialogList = new DialogList();
    }

    isDialogValid(dialog) {
        return Object.values(Dialogs).includes(dialog);
    }
}

export const globalDialogStore = new DialogStore();
