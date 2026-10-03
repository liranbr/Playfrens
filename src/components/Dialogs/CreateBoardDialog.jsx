import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogBase } from "./DialogRoot.jsx";
import { Button } from "@/components";
import { useBoardStore } from "@/stores";
import { toastError, toastSuccess } from "@/Utils";

// Creates a new owned board (capped server-side, see BoardStore.canCreateBoard) and switches to it.
export function CreateBoardDialog({ open, closeDialog }) {
    const boardStore = useBoardStore();
    const [name, setName] = useState("");
    const [creating, setCreating] = useState(false);

    const handleCreate = async () => {
        if (creating) return;
        setCreating(true);
        try {
            const board = await boardStore.createBoard(name.trim());
            toastSuccess(`Created ${board.name}`);
            setName("");
            closeDialog();
        } catch (err) {
            toastError(err.message);
        } finally {
            setCreating(false);
        }
    };
    const saveOnEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleCreate();
        }
    };

    return (
        <DialogBase open={open} onOpenChange={closeDialog}>
            <Dialog.Title>Create Board</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>Create a new board and switch to it</Dialog.Description>
            </VisuallyHidden>

            <fieldset>
                <label>Board name</label>
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={saveOnEnter}
                    placeholder="My Board"
                    autoFocus
                />
            </fieldset>

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Cancel
                </Button>
                <Button variant="primary" disabled={creating} onClick={handleCreate}>
                    Create
                </Button>
            </div>
        </DialogBase>
    );
}
