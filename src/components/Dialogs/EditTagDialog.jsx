import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogBase } from "./DialogRoot.jsx";
import { FriendTagObject, TagObject, tagTypeStrings } from "@/models";
import { useDataStore } from "@/stores";
import { Button } from "@/components";
import { useState } from "react";

// Both Edits existing tags, and Adds new ones - depending on whether a TagObject is provided, otherwise based on the newTagType
export function EditTagDialog({ open, closeDialog, editingTag = null, addingTagOfType = null }) {
    const [advancedView, setAdvancedView] = useState(false);
    const isEdit = editingTag instanceof TagObject;
    const mode = isEdit ? "Edit" : "Add";
    const tagType = isEdit ? editingTag.type : addingTagOfType;
    const title = mode + " " + tagTypeStrings[tagType].single;
    const description = isEdit
        ? "Editing " + editingTag.name
        : "Adding a new " + tagTypeStrings[tagType].single;
    const dataStore = useDataStore();

    const handleSave = () => {
        const newTagName = document.getElementById("tagNameInput").value;
        const newSteamID = document.getElementById("tagSteamIDInput")?.value ?? "";
        const newIconURL = document.getElementById("tagIconURLInput")?.value ?? "";
        const savedSuccess = (() => {
            if (isEdit) {
                const data = {}
                data["name"] = newTagName;
                newSteamID !== undefined && (data["steamID"] = newSteamID);
                newIconURL !== undefined && (data["iconURL"] = newIconURL);
                return dataStore.editTag(editingTag, data);
            }
            else {
                return dataStore.addTag(new (tagType === "friend" ? FriendTagObject : TagObject)({ type: tagType, name: newTagName }))
            }
        })()

        if (savedSuccess) {
            closeDialog();
        }
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
                    <span className="info-icon" />
                    <p>Just a name. It doesn't connect to a Playfrens or Steam account.</p>
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
                {
                    tagType === "friend" &&
                    <>
                        {
                            (advancedView || editingTag?.steamID) &&
                            <>
                                <label>Steam ID</label>
                                <input
                                    id="tagSteamIDInput"
                                    onKeyDown={saveOnEnter}
                                    defaultValue={editingTag?.steamID}
                                    autoFocus
                                />
                                <label>Icon URL</label>
                                <input
                                    id="tagIconURLInput"
                                    onKeyDown={saveOnEnter}
                                    defaultValue={editingTag?.iconURL}
                                    autoFocus
                                />
                            </>
                        }
                    </>
                }
            </fieldset>

            <div className="rx-dialog-footer">
                {!editingTag?.steamID && <Button variant="secondary" onClick={() => setAdvancedView(!advancedView)}>
                    {advancedView ? "Simple" : "Advanced"}
                </Button>}
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
