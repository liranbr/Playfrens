import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { addTag, EditTag } from "../../DataStore.jsx";
import { useFilterStore } from "../../FilterStore.jsx";
import { Button } from "../common/Button.jsx";

export function EditTagDialog({ open, closeDialog, tagType, tagName = "" }) {
    const filterStore = useFilterStore();
    const mode = tagName ? "Edit" : "Add";
    const title = mode + " " + tagType.single;
    const description = mode === "Edit" ? "Editing " + tagName : "Adding a new " + tagType.single;

    const handleHide = () => closeDialog();
    const handleSave = () => {
        const newTagName = document.getElementById("tagNameInput").value;
        if (mode === "Edit") {
            const success = EditTag(tagType, tagName, newTagName);
            if (success) {
                filterStore.UpdateTagBandaid(tagType, tagName, newTagName); // TODO: Temp, remove when tags get UUIDs
                handleHide();
            }
        } else {
            const success = addTag(tagType, newTagName);
            if (success) {
                handleHide();
            }
        }
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
