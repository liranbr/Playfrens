import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export const SettingsDialog = ({ open, closeDialog }) => {
    const handleHide = () => closeDialog();

    return (
        <Dialog.Root open={open} onOpenChange={handleHide}>
            <Dialog.Portal>
                <Dialog.Overlay className="rx-dialog-overlay" />
                <Dialog.Content className="rx-dialog">
                    <Dialog.Title>Settings</Dialog.Title>
                    <VisuallyHidden>
                        <Dialog.Description>Configure application settings</Dialog.Description>
                    </VisuallyHidden>

                    <p>Settings will be implemented here.</p>

                    <div className="rx-dialog-footer">
                        <button className="button-secondary" onClick={handleHide}>
                            Close
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
