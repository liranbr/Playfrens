import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { DialogBase } from "./DialogRoot.jsx";
import { Button } from "@/components";

export function DeleteWarningDialog({
    open,
    closeDialog,
    itemName,
    deleteFunction,
    description,
    countdownSeconds = 0,
}) {
    const [secondsRemaining, setSecondsRemaining] = useState(countdownSeconds);

    useEffect(() => {
        if (!open || secondsRemaining <= 0) return;
        const timer = setTimeout(() => setSecondsRemaining((s) => s - 1), 1000);
        return () => clearTimeout(timer);
    }, [open, secondsRemaining]);

    const handleDelete = () => {
        closeDialog();
        deleteFunction?.();
    };

    return (
        <DialogBase open={open} onOpenChange={closeDialog}>
            <Dialog.Title>Delete &apos;{itemName}&apos;</Dialog.Title>
            <Dialog.Description>
                Are you sure you want to delete <b>{itemName}</b>? {description} This action cannot
                be undone.
            </Dialog.Description>

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Cancel
                </Button>
                <Button variant="danger" disabled={secondsRemaining > 0} onClick={handleDelete}>
                    {secondsRemaining > 0 ? `Delete (${secondsRemaining})` : "Delete"}
                </Button>
            </div>
        </DialogBase>
    );
}
