import * as Dialog from "@radix-ui/react-dialog";
import Button from "react-bootstrap/Button";

export function DeleteWarningModal({
    open,
    closeModal,
    itemName,
    deleteFunction,
}) {
    const handleDelete = () => {
        closeModal();
        if (deleteFunction) {
            deleteFunction();
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={closeModal}>
            <Dialog.Portal>
                <Dialog.Overlay className="rx-dialog-overlay" />
                <Dialog.Content className="rx-dialog">
                    <Dialog.Title>Delete '{itemName}'</Dialog.Title>
                    <Dialog.Description>
                        Are you sure you want to delete <b>{itemName}</b>? This
                        action cannot be undone.
                    </Dialog.Description>

                    <div className="rx-dialog-footer">
                        <Button variant="secondary" onClick={closeModal}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDelete}>
                            Delete
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
