import { observer } from "mobx-react-lite";
import { Dialogs, dialogStore } from "./DialogStore.jsx";
import { EditTagDialog } from "./EditTagDialog.jsx";
import { EditGameDialog } from "./EditGameDialog.jsx";
import { GamePageDialog } from "./GamePageDialog.jsx";
import { DeleteWarningDialog } from "./DeleteWarningDialog.jsx";
import { SettingsDialog } from "./SettingsDialog.jsx";
import { AboutDialog } from "./AboutDialog.jsx";
import * as Dialog from "@radix-ui/react-dialog";
export const DialogRoot = observer(() => (
    <>
        {dialogStore.dialogStack.map(({ name, props, open }, index) => {
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
        })}
    </>
));

// This is the base for all dialogs only
export const DialogBase = observer(({ children, open, onOpenChange, overlay = true, contentProps = undefined }) => {
    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                {overlay && <Dialog.Overlay className="rx-dialog-overlay" />}
                <Dialog.Content {...contentProps} className={contentProps?.className ? contentProps.className : "rx-dialog"}>
                    {children}
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
})