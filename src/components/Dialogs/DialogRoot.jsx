import { observer } from "mobx-react-lite";
import { dialogStore } from "@/stores";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect } from "react";

export const DialogRoot = observer(() => {

    const store = dialogStore;
    const active = store.activeDialog;
    const size = active?.list?.size ?? 0;
    const prev = store.prevDialog;

    if (!active) return <></>;

    const isDialogActive = () => {
        if (size == 1 && store.activeIsOpen) return true;
        if (size == 2 && (store.prevIsOpen || store.activeIsOpen)) return true;
        if (size.length >= 2) return true;
        return false;
    }


    return (
        // There's 3 dialogs here.
        // 1 dialog that acts as the root for the other 2, its purpose to enable the darkening overlay, the other 2 are the active dialog and the previous dialog
        // previous dialog is only relevant when there's stacked dialog requests (e.g. GamePage Dialog -> Delete Game Dialog), they are kept for the transioning animation when closing or opening dialogs.

        <Dialog.Root open={isDialogActive()}>
            <Dialog.Overlay className="rx-dialog-overlay" />
            {(() => {
                if (!prev) return <></>;
                const { dialog, open, props } = prev;
                const DialogComponent = dialog;
                return <DialogComponent {...props} open={open} closeDialog={store.close} key={size - 1} />;
            })()}
            {(() => {
                const { dialog, open, props } = active;
                const DialogComponent = dialog;
                return <DialogComponent {...props} open={open} closeDialog={store.close} key={size} />;
            })()}
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