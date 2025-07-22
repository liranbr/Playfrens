import * as Dialog from "@radix-ui/react-dialog";

export function DeleteWarningDialog({ open, closeDialog, itemName, deleteFunction }) {
    const handleDelete = () => {
        closeDialog();
        deleteFunction?.();
    };

    return (
        <Dialog.Root open={open} onOpenChange={closeDialog}>
            <Dialog.Portal>
                <Dialog.Overlay className="rx-dialog-overlay" />
                <Dialog.Content className="rx-dialog">
                    <Dialog.Title>Delete '{itemName}'</Dialog.Title>
                    <Dialog.Description>
                        Are you sure you want to delete <b>{itemName}</b>? This action cannot be
                        undone.
                    </Dialog.Description>

                    <div className="rx-dialog-footer">
                        <button className="button-secondary" onClick={closeDialog}>
                            Cancel
                        </button>
                        <button className="button-danger" onClick={handleDelete}>
                            Delete
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
