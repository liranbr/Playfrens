import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogBase } from "./DialogRoot.jsx";
import { TagObject, tagTypeStrings, FriendTagObject } from "@/models";
import { Dialogs, globalDialogStore, useDataStore } from "@/stores";
import { Button, FriendAvatar, IconButton, InfoIcon, LabelBadge } from "@/components";
import { useState } from "react";
import { BiLogoSteam } from "react-icons/bi";
import { MdClose } from "react-icons/md";
import { loadFromStorage, saveToStorage } from "@/Utils";
import "./EditTagDialog.css";

// Dismiss the Steam import hint on the client side only.
const STEAM_FRIEND_HINT_DISMISSED_KEY = "friend-steam-hint-dismissed";

// Both Edits existing tags, and Adds new ones - depending on whether a TagObject is provided, otherwise based on the newTagType
export function EditTagDialog({ open, closeDialog, editingTag = null, addingTagOfType = null }) {
    const [advancedView, setAdvancedView] = useState(false);
    const [iconURLPreview, setIconURLPreview] = useState(editingTag?.iconURL ?? "");
    const [hintDismissed, setHintDismissed] = useState(() =>
        loadFromStorage(STEAM_FRIEND_HINT_DISMISSED_KEY, false),
    );
    const isEdit = editingTag instanceof TagObject;
    const mode = isEdit ? "Edit" : "Add";
    const tagType = isEdit ? editingTag.type : addingTagOfType;
    const isFriend = tagType === "friend";
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
                const data = {};
                data["name"] = newTagName;
                newSteamID !== undefined && (data["steamID"] = newSteamID);
                newIconURL !== undefined && (data["iconURL"] = newIconURL);
                return dataStore.editTag(editingTag, data);
            } else {
                return dataStore.addTag(
                    new (tagType === "friend" ? FriendTagObject : TagObject)({
                        type: tagType,
                        name: newTagName,
                    }),
                );
            }
        })();

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
    const handleGoToImport = () => {
        globalDialogStore.insertPrevious(Dialogs.SteamImport);
        closeDialog();
    };

    return (
        <DialogBase open={open} onOpenChange={closeDialog}>
            <Dialog.Title>{title}</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>{description}</Dialog.Description>
            </VisuallyHidden>

            {isFriend && !isEdit && !hintDismissed && (
                <div className="steam-import-hint">
                    <BiLogoSteam className="steam-import-hint-icon" />
                    <p>Have Steam friends? Import your whole list at once.</p>
                    <Button variant="secondary" onClick={handleGoToImport}>
                        Steam Import
                    </Button>
                    <IconButton
                        className="steam-import-hint-dismiss"
                        icon={<MdClose />}
                        aria-label="Dismiss"
                        onClick={() => {
                            saveToStorage(STEAM_FRIEND_HINT_DISMISSED_KEY, true);
                            setHintDismissed(true);
                        }}
                    />
                </div>
            )}

            <fieldset>
                <label>
                    Name
                    {isFriend && (
                        <InfoIcon message="Just a name. It doesn't connect to any account." />
                    )}
                </label>
                <input
                    id="tagNameInput"
                    onKeyDown={saveOnEnter}
                    defaultValue={editingTag?.name}
                    autoFocus
                />
                {isFriend && (advancedView || editingTag?.steamID || editingTag?.iconURL) && (
                    <>
                        <label>
                            Icon URL
                            <LabelBadge />
                        </label>
                        <div className="icon-url-row">
                            <input
                                id="tagIconURLInput"
                                onKeyDown={saveOnEnter}
                                defaultValue={editingTag?.iconURL}
                                onChange={(e) => setIconURLPreview(e.target.value)}
                                autoFocus
                            />
                            <FriendAvatar
                                iconURL={iconURLPreview}
                                className="icon-url-preview"
                                ignoreDisplaySetting
                            />
                        </div>
                        <label>
                            Steam ID
                            <LabelBadge />
                        </label>
                        <input
                            id="tagSteamIDInput"
                            onKeyDown={saveOnEnter}
                            defaultValue={editingTag?.steamID}
                        />
                    </>
                )}
            </fieldset>

            <div className="rx-dialog-footer">
                {isFriend && !editingTag?.steamID && !editingTag?.iconURL && (
                    <div className="footer-left">
                        <Button variant="ghost" onClick={() => setAdvancedView(!advancedView)}>
                            {advancedView ? "Simple" : "Advanced"}
                        </Button>
                    </div>
                )}
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
