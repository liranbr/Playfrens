import { DialogBase } from "./DialogRoot.jsx";
import * as Dialog from "@radix-ui/react-dialog";
import "./SteamImportDialog.css";
import { Button } from "@/components/index.js";

export const SteamImportDialog = ({ open, closeDialog }) => {
    const title = "Steam Import (WIP)";
    const description = "This doesn't do anything yet.";

    return (
        <DialogBase
            open={open}
            onOpenChange={closeDialog}
            contentProps={{
                className: "rx-dialog steam-import-dialog",
                onOpenAutoFocus: (e) => {
                    e.preventDefault(); // Focuses the dialog content instead of the first interactable element
                    e.target.focus();
                },
            }}
        >
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Description>{description}</Dialog.Description>
            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
};
