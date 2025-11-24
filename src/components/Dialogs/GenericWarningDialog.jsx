import * as Dialog from "@radix-ui/react-dialog";
import { DialogBase } from "./DialogRoot.jsx";
import { Button } from "@/components";

export function GenericWarningDialog({ open, closeDialog, message, continueFunction }) {
    const handleContinue = () => {
        closeDialog();
        continueFunction?.();
    };

    return (
        <DialogBase open={open} onOpenChange={closeDialog}>
            <Dialog.Title>Warning</Dialog.Title>
            <Dialog.Description>{message}</Dialog.Description>

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleContinue}>
                    Continue
                </Button>
            </div>
        </DialogBase>
    );
}
