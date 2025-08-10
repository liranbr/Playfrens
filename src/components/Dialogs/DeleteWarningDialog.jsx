import * as Dialog from "@radix-ui/react-dialog";
import { DialogBase } from "./DialogRoot.jsx";
import { Button } from "@/components";

export function DeleteWarningDialog({ open, closeDialog, itemName, deleteFunction }) {
    const handleDelete = () => {
        closeDialog();
        deleteFunction?.();
    };

    return (
        <DialogBase open={open} onOpenChange={closeDialog}>
            <Dialog.Title>Delete '{itemName}'</Dialog.Title>
            <Dialog.Description>
                Are you sure you want to delete <b>{itemName}</b>? This action cannot be
                undone.
            </Dialog.Description>

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Cancel
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                    Delete
                </Button>
            </div>
        </DialogBase>
    );
}
