import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export const AboutDialog = ({ open, closeDialog }) => {
    const handleHide = () => closeDialog();

    return (
        <Dialog.Root open={open} onOpenChange={handleHide}>
            <Dialog.Portal>
                <Dialog.Overlay className="rx-dialog-overlay" />
                <Dialog.Content className="rx-dialog">
                    <Dialog.Title>About</Dialog.Title>
                    <VisuallyHidden>
                        <Dialog.Description>About Playfrens</Dialog.Description>
                    </VisuallyHidden>

                    <img
                        style={{ width: "100%" }}
                        src="https://i.imgur.com/tlXb8mI.jpeg"
                        alt="i love my puter, all my friends are inside it"
                    />
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
