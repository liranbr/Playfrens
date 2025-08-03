import { observer } from "mobx-react-lite";
import { Dialogs, dialogStore } from "./DialogStore.jsx";
import { EditTagDialog } from "./EditTagDialog.jsx";
import { EditGameDialog } from "./EditGameDialog.jsx";
import { GamePageDialog } from "./GamePageDialog.jsx";
import { DeleteWarningDialog } from "./DeleteWarningDialog.jsx";
import { SettingsDialog } from "./SettingsDialog.jsx";
import { AboutDialog } from "./AboutDialog.jsx";
import * as Dialog from "@radix-ui/react-dialog";
export const DialogRoot = observer(() => {

    const store = dialogStore;
    const stack = store.dialogStack;

    console.log(stack.length == 1 && stack[0].open,
        stack.length > 1 && stack[1].open,
        stack.length > 2 && stack[2].open)
    const isDialogActive = () => {
        if (stack.length == 1 && stack[0].open) return true; // When closing the first dialog in stack size 1
        if (stack.length == 2 && !store.previousDialog.open && store.currentDialog.open) return true; // When calling closeTwo() and the stack is already size 2
        if (stack.length > 1 && stack.some(item => item.open === true)) return true; // Any of them is active
        return false;
    }
    return (
        // There're 2 Dialogs, one that triggers specifically the overlay, 
        // the other dialog renders the content the user is requesting to open.
        <Dialog.Root open={isDialogActive()}>
            <Dialog.Overlay className="rx-dialog-overlay" />
            {
                stack.map(({ name, props, open }, index) => {
                    const commonProps = {
                        ...props,
                        open,
                        closeDialog: dialogStore.close,
                    };
                    switch (name) {
                        case Dialogs.DeleteWarning:
                            return <DeleteWarningDialog {...commonProps} key={index} />;
                        case Dialogs.EditTag:
                            return <EditTagDialog {...commonProps} key={index} />;
                        case Dialogs.EditGame:
                            return <EditGameDialog {...commonProps} key={index} />;
                        case Dialogs.Playfrens:
                            return <GamePageDialog {...commonProps} key={index} />;
                        case Dialogs.Settings:
                            return <SettingsDialog {...commonProps} key={index} />;
                        case Dialogs.About:
                            return <AboutDialog {...commonProps} key={index} />;
                        default:
                            console.warn(`Unknown dialog type: ${name}`);
                            return null;
                    }
                })
            }
        </Dialog.Root>
    )
});

// This is the base for all dialogs
export const DialogBase = observer(({ children, open, onOpenChange, contentProps = undefined }) => (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content {...contentProps} className={contentProps?.className ? contentProps.className : "rx-dialog"}>
            {children}
        </Dialog.Content>
    </Dialog.Root>
))