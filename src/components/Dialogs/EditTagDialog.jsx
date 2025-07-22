import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { addTag, EditTag } from "../../Store.jsx";

export function EditTagDialog({ open, closeDialog, tagType, tagName = "" }) {
    const mode = tagName ? "Edit" : "Add";
    const title = mode + " " + tagType.single;
    const description = mode === "Edit" ? "Editing " + tagName : "Adding a new " + tagType.single;

    const handleHide = () => closeDialog();
    const handleSave = () => {
        const newTagName = document.getElementById("tagNameInput").value;
        const doneFunction =
            mode === "Edit" ? EditTag(tagType, tagName, newTagName) : addTag(tagType, newTagName);
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
                        <button className="button-secondary" onClick={handleHide}>
                            Cancel
                        </button>
                        <button className="button-primary" onClick={handleSave}>
                            Save
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
