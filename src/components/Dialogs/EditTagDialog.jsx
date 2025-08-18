import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogBase } from "./DialogRoot.jsx";
import { TagObject, tagTypeStrings } from "@/models";
import { useDataStore } from "@/stores";
import { Button } from "@/components";

// Both Edits existing tags, and Adds new ones - depending on whether a TagObject is provided, otherwise based on the newTagType
export function EditTagDialog({ open, closeDialog, editingTag = null, addingTagOfType = null }) {
    const editOrAdd = editingTag instanceof TagObject;
    const mode = editOrAdd ? "Edit" : "Add";
    const tagType = editOrAdd ? editingTag.type : addingTagOfType;
    const title = mode + " " + tagTypeStrings[tagType].single;
    const description = editOrAdd
        ? "Editing " + editingTag.name
        : "Adding a new " + tagTypeStrings[tagType].single;
    const dataStore = useDataStore();

    const handleHide = () => closeDialog();
    const handleSave = () => {
        const newTagName = document.getElementById("tagNameInput").value;
        const savedSuccess = editOrAdd
            ? dataStore.editTag(editingTag, newTagName)
            : dataStore.addTag(new TagObject({ type: tagType, name: newTagName }));
        if (savedSuccess) handleHide();
    };
    const saveOnEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <DialogBase open={open} onOpenChange={handleHide}>
            <Dialog.Title>{title}</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>{description}</Dialog.Description>
            </VisuallyHidden>

            <fieldset>
                <label>Name</label>
                <input
                    id="tagNameInput"
                    onKeyDown={saveOnEnter}
                    defaultValue={editingTag?.name}
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
        </DialogBase>
    );
}
