import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Button from "react-bootstrap/Button";
import { addTag, EditTag } from "../../Store.jsx";

export function EditDataModal({ open, closeModal, tagType, tagName = "" }) {
    const mode = tagName ? "Edit" : "Add";
    const title = mode + " " + tagType.single;
    const description =
        mode === "Edit"
            ? "Editing " + tagName
            : "Adding a new " + tagType.single;

    const handleHide = () => closeModal();
    const handleSave = () => {
        const newtagName = document.getElementById("tagNameInput").value;
        const doneFunction =
            mode === "Edit"
                ? EditTag(tagType, tagName, newtagName)
                : addTag(tagType, newtagName);
        if (doneFunction) handleHide();
    };
    const saveOnEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleHide}>
            <Dialog.Portal>
                <Dialog.Overlay className="rx-dialog-overlay" />
                <Dialog.Content className="rx-dialog">
                    <Dialog.Title>{title}</Dialog.Title>
                    <VisuallyHidden>
                        <Dialog.Description>{description}</Dialog.Description>
                    </VisuallyHidden>

                    <fieldset>
                        <label>Name</label>
                        <input
                            id="tagNameInput"
                            onKeyDown={saveOnEnter}
                            defaultValue={tagName}
                            autoFocus
                        />
                    </fieldset>

                    <div className="rx-dialog-footer">
                        <Button variant="secondary" onClick={handleHide}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            Save
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
