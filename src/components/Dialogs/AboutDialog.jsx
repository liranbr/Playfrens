import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogBase } from "./DialogRoot.jsx";
import { Button } from "@/components";

export const AboutDialog = ({ open, closeDialog }) => {
    const handleHide = () => closeDialog();

    return (
        <DialogBase open={open} onOpenChange={closeDialog}>
            <Dialog.Title>About</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>About Playfrens</Dialog.Description>
            </VisuallyHidden>

            <img
                src="https://i.imgur.com/tlXb8mI.jpeg"
                alt="i love my puter, all my friends are inside it"
                referrerPolicy="no-referrer"
            />
            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={handleHide}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
};
