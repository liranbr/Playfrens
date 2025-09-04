import { observer } from "mobx-react-lite";
import * as Dialog from "@radix-ui/react-dialog";
import { globalDialogStore } from "@/stores";

export const DialogRoot = observer(() => {
    const store = globalDialogStore;
    const active = store.activeDialog;
    const size = active?.list?.size ?? 0;
    const prev = store.prevDialog;

    if (!active) return <></>;

    const isDialogActive = () =>
        (size === 1 && store.activeIsOpen) ||
        (size === 2 && (store.prevIsOpen || store.activeIsOpen)) ||
        size.length >= 2;

    return (
        // There's 3 dialog roots - 1 is the wrapper that provides the consistent darkening overlay,
        // and the inner 2 contain the currently active dialog and the previous dialog, to create a fade-out/fade-in transition.

        <Dialog.Root open={isDialogActive()}>
            <Dialog.Overlay className="rx-dialog-overlay" />
            {(() => {
                if (!prev) return <></>;
                const { dialog, open, props } = prev;
                const DialogComponent = dialog;
                return (
                    <DialogComponent
                        {...props}
                        open={open}
                        closeDialog={store.close}
                        key={size - 1}
                    />
                );
            })()}
            {(() => {
                const { dialog, open, props } = active;
                const DialogComponent = dialog;
                return (
                    <DialogComponent {...props} open={open} closeDialog={store.close} key={size} />
                );
            })()}
        </Dialog.Root>
    );
});

// The base that dialog components use
export const DialogBase = observer(({ children, open, onOpenChange, contentProps = undefined }) => (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Content
            {...contentProps}
            className={`${contentProps?.className ? contentProps.className : "rx-dialog"} ${open ? "" : "dialog-hidden"}`}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
        >
            {children}
        </Dialog.Content>
    </Dialog.Root>
));
