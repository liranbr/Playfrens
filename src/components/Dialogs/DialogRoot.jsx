import { observer } from "mobx-react-lite";
import { dialogStore } from "./DialogStore.jsx";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect } from "react";

export const DialogRoot = observer(() => {

    const store = dialogStore;
    const active = store.activeDialog;
    const size = active?.list?.size ?? 0;
    const prev = store.prevDialog;

    useEffect(() => {
        console.log("PREVIOUS CHANGE!!!")
    }, [store.prevDialog])

    if (!active) return <></>;

    const isDialogActive = () => {
        if (size == 1 && store.activeIsOpen) return true;
        if (size == 2 && (store.prevIsOpen || store.activeIsOpen)) return true;
        if (size.length >= 2) return true;
        return false;
    }


    return (
        // There're 2 Dialogs, one that triggers specifically the overlay, 
        // the other dialog renders the content the user is requesting to open.
        <Dialog.Root open={isDialogActive()}>
            <Dialog.Overlay className="rx-dialog-overlay" />
            {(() => {
                if (!prev) return <></>;
                console.log("prev update", prev)
                const { dialog, open, props } = prev;
                const DialogComponent = dialog;
                return <DialogComponent {...props} open={open} closeDialog={store.close} key={size - 1} />;
            })()}
            {(() => {
                const { dialog, open, props } = active;
                const DialogComponent = dialog;
                console.log("open stat:", open)
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