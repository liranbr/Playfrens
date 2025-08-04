import { observer } from "mobx-react-lite";
import { dialogStore } from "./DialogStore.jsx";
import * as Dialog from "@radix-ui/react-dialog";

export const DialogRoot = observer(() => {

    const store = dialogStore;
    const stack = store.dialogStack;

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
                stack.map(({ dialog, props, open }, index) => {
                    console.log(dialog);
                    const DialogComponent = dialog;
                    if (!dialog) {
                        console.warn(`Unknown dialog type: ${Dialog}`);
                        return null;
                    }
                    return <DialogComponent {...props} open={open} closeDialog={dialogStore.close} key={index} />;
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