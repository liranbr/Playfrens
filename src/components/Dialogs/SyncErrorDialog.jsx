import * as Dialog from "@radix-ui/react-dialog";
import { DialogBase } from "./DialogRoot.jsx";
import { Button } from "@/components";

// Asks the user to reload, this cannot be dismissed
// This happens when local/remote states can no longer be trusted to match once the request queue gives up.
export function SyncErrorDialog({ open }) {
    return (
        <DialogBase
            open={open}
            onOpenChange={() => { }}
            contentProps={{
                onEscapeKeyDown: (e) => e.preventDefault(),
                onPointerDownOutside: (e) => e.preventDefault(),
                onInteractOutside: (e) => e.preventDefault(),
            }}
        >
            <Dialog.Title>Connection Problem</Dialog.Title>
            <Dialog.Description>
                We couldn&apos;t save your latest changes after several attempts. Your data may be
                out of sync - please reload the page before continuing.
            </Dialog.Description>

            <div className="rx-dialog-footer">
                <Button variant="primary" onClick={() => window.location.reload()}>
                    Reload
                </Button>
            </div>
        </DialogBase>
    );
}
