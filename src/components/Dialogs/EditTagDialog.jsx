import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogBase } from "./DialogRoot.jsx";
import { TagObject, tagTypeStrings } from "@/models";
import { useDataStore } from "@/stores";
import { Button, InfoIcon } from "@/components";

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

    const handleSave = () => {
        const newTagName = document.getElementById("tagNameInput").value;
        const savedSuccess = editOrAdd
            ? dataStore.editTag(editingTag, newTagName)
            : dataStore.addTag(new TagObject({ type: tagType, name: newTagName }));
        if (savedSuccess) closeDialog();
    };
    const saveOnEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <DialogBase open={open} onOpenChange={closeDialog}>
            <Dialog.Title>{title}</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>{description}</Dialog.Description>
            </VisuallyHidden>

            {tagType === "friend" && (
                <div className="dialog-callout info">
                    <p>
                        <span className="info-icon">i</span>
                        Just a name. This doesn't connect to a Playfrens or Steam account.
                    </p>
                </div>
            )}

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
                <Button variant="secondary" onClick={closeDialog}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                    Save
                </Button>
            </div>
        </DialogBase>
    );
}
