import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogBase } from "./DialogRoot.jsx";
import { TagObject } from "@/models";
import { useDataStore, useFilterStore } from "@/stores";
import { Button } from "@/components";

export function EditTagDialog({ open, closeDialog, tag = null, newTagType = null }) {
    const mode = tag instanceof TagObject ? "Edit" : "Add";
    const tagType = tag?.type || newTagType;
    const title = mode + " " + tagType.single;
    const description = mode === "Edit" ? "Editing " + tag?.name : "Adding a new " + tagType.single;
    // const filterStore = useFilterStore();
    const dataStore = useDataStore();

    const handleHide = () => closeDialog();
    const handleSave = () => {
        const newTagName = document.getElementById("tagNameInput").value;
        const savedSuccess =
            mode === "Edit"
                ? dataStore.editTag(tag, newTagName)
                : dataStore.addTag(new TagObject({ tagTypeKey: tagType.key, name: newTagName }));
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
                    defaultValue={tag?.name}
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
