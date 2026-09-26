import * as Dialog from "@radix-ui/react-dialog";
import { observer } from "mobx-react-lite";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogBase } from "./DialogRoot.jsx";
import { TagObject, tagTypeStrings, FriendTagObject } from "@/models";
import { Dialogs, globalDialogStore, useBoardStore, useDataStore, useUserStore } from "@/stores";
import { Button, FriendAvatar, IconButton, InfoIcon, LabelBadge, MultiCombobox } from "@/components";
import { useEffect, useState } from "react";
import { BiLogoSteam } from "react-icons/bi";
import { MdClose } from "react-icons/md";
import { loadFromStorage, saveToStorage, toastError } from "@/Utils";
import { assignAccountToTag, listBoardGuests, unassignAccountFromTag } from "@/APIUtils.js";
import "./EditTagDialog.css";

// Un-/Assign board members onto a friend tag. Assigned accounts can use this tag and manage it.
const AssignedAccountsSection = observer(({ tag }) => {
    const boardStore = useBoardStore();
    const boardId = boardStore.activeBoardId;
    const [members, setMembers] = useState(boardStore.getCachedGuests(boardId) ?? []);
    const [pendingAccountId, setPendingAccountId] = useState(null);

    useEffect(() => {
        if (boardStore.getCachedGuests(boardId)) return;
        listBoardGuests(boardId)
            .then((fetched) => {
                setMembers(fetched);
                boardStore.setCachedGuests(boardId, fetched);
            })
            .catch((err) => toastError(err.message));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the board changes
    }, [boardId]);

    const updateAssignment = async (member, apiCall) => {
        setPendingAccountId(member.id);
        try {
            tag.linkedAccountIds = await apiCall(boardId, tag.id, member.id);
        } catch (err) {
            toastError(err.message);
        } finally {
            setPendingAccountId(null);
        }
    };

    return (
        <fieldset>
            <label>
                Assigned Accounts
                <InfoIcon message="Assigned accounts can self-join/leave groups with this tag, and manage it." />
            </label>
            <MultiCombobox
                options={members}
                selectedIds={tag.linkedAccountIds}
                getLabel={(member) => member.displayName}
                pendingOptionId={pendingAccountId}
                placeholder="Search accounts to assign..."
                emptyPlaceholder="Everyone is assigned"
                onAdd={(member) => updateAssignment(member, assignAccountToTag)}
                onRemove={(member) => updateAssignment(member, unassignAccountFromTag)}
            />
        </fieldset>
    );
});

// Dismiss the Steam import hint on the client side only.
const STEAM_FRIEND_HINT_DISMISSED_KEY = "friend-steam-hint-dismissed";

// Both Edits existing tags, and Adds new ones - depending on whether a TagObject is provided, otherwise based on the newTagType
export const EditTagDialog = observer(function EditTagDialog({
    open,
    closeDialog,
    editingTag = null,
    addingTagOfType = null,
}) {
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
    const { userInfo } = useUserStore();
    const { isOwner } = useBoardStore();
    // Only owner or a linked account can manage this friend tag
    const canManage = !isEdit || editingTag.isManageableBy({ accountId: userInfo?.id, isOwner });

    const handleSave = () => {
        if (!canManage) return;
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

            {isFriend && !isEdit && !hintDismissed && !userInfo.isGuest && (
                <div className="steam-import-hint">
                    <BiLogoSteam className="steam-import-hint-icon" />
                    <p>Have Steam friends? You can import them in one go here:</p>
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
                    {isFriend &&
                        (!editingTag?.linkedAccountIds?.length ? (
                            <InfoIcon message="Just a name. It doesn't connect to any account." />
                        ) : isOwner ? (
                            <InfoIcon message="Linked to an account, see Assigned Accounts below." />
                        ) : (
                            <InfoIcon message="Linked to an account." />
                        ))}
                </label>
                <input
                    id="tagNameInput"
                    onKeyDown={saveOnEnter}
                    defaultValue={editingTag?.name}
                    disabled={!canManage}
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
                                disabled={!canManage}
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
                            disabled={!canManage}
                        />
                        {hintDismissed && !userInfo.isGuest && (
                            <>
                                <label>Import Steam Friends List</label>
                                <Button variant="secondary" onClick={handleGoToImport}>
                                    Steam Import Page
                                </Button>
                            </>
                        )}
                    </>
                )}
            </fieldset>

            {isFriend && isEdit && isOwner && <AssignedAccountsSection tag={editingTag} />}

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
                <Button variant="primary" onClick={handleSave} disabled={!canManage}>
                    Save
                </Button>
            </div>
        </DialogBase>
    );
});
