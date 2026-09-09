import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import * as Dialog from "@radix-ui/react-dialog";
import * as Avatar from "@radix-ui/react-avatar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MdContentCopy, MdPerson, MdPersonRemove } from "react-icons/md";
import { DialogBase } from "./DialogRoot.jsx";
import { Button } from "@/components/index.js";
import { globalBoardStore } from "@/stores/index.js";
import { createBoardMember, listBoardMembers, removeBoardMember } from "@/APIUtils.js";
import { toastError, toastSuccess } from "@/Utils";
import "./BoardMembersDialog.css";

// Lists this board's members and, if you're the owner, lets you create or remove logins.
// For now only works for none-accounts.
export const BoardMembersDialog = observer(({ open, closeDialog }) => {
    const boardId = globalBoardStore.activeBoardId;
    const activeBoard = globalBoardStore.activeBoard;
    const isOwner = activeBoard?.role === "owner";
    const boardLink = `${window.location.origin}/app/${activeBoard?.shortId ?? boardId}`;

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [createdCredentials, setCreatedCredentials] = useState(null);

    async function refresh() {
        setLoading(true);
        try {
            setMembers(await listBoardMembers(boardId));
        } catch (err) {
            toastError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (open) refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the dialog opens
    }, [open]);

    async function handleCreate() {
        if (creating || !newUsername.trim() || newPassword.length < 8) return;
        setCreating(true);
        try {
            const result = await createBoardMember(boardId, newUsername.trim(), newPassword);
            setCreatedCredentials({ username: result.member.username, password: result.password });
            setNewUsername("");
            setNewPassword("");
            await refresh();
            await globalBoardStore.refreshBoardsList();
            toastSuccess(`Created a login for ${result.member.displayName}`);
        } catch (err) {
            toastError(err.message);
        } finally {
            setCreating(false);
        }
    }

    const saveOnEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleCreate();
        }
    };

    async function copyToClipboard(text, message) {
        try {
            await navigator.clipboard.writeText(text);
            toastSuccess(message);
        } catch (err) {
            toastError("Failed to copy: " + err);
        }
    }

    return (
        <DialogBase
            open={open}
            onOpenChange={closeDialog}
            contentProps={{
                className: "rx-dialog board-members-dialog",
                onOpenAutoFocus: (e) => {
                    e.preventDefault(); // Focuses the dialog content instead of the first interactable element
                    e.target.focus();
                },
            }}
        >
            <Dialog.Title>Board Members</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>Manage who can access and edit this board</Dialog.Description>
            </VisuallyHidden>

            <div className="dialog-callout">
                <label>Board link</label>
                <div className="board-members-copy-row">
                    <input readOnly value={boardLink} onFocus={(e) => e.target.select()} />
                    <Button
                        variant="secondary"
                        onClick={() => copyToClipboard(boardLink, "Board link copied!")}
                    >
                        <MdContentCopy /> Copy
                    </Button>
                </div>
                <small>Anyone who already has a login below can use this to jump to this board.</small>
            </div>

            {loading ? (
                <p>Loading members...</p>
            ) : (
                <div className="board-members-list">
                    {members.map((member) => (
                        <div className="board-member-row" key={member.id}>
                            <Avatar.Root className="rx-avatar">
                                <Avatar.Image
                                    src={member.avatarURL ?? undefined}
                                    referrerPolicy="no-referrer"
                                />
                                <Avatar.Fallback className="rx-avatarless" asChild>
                                    <MdPerson />
                                </Avatar.Fallback>
                            </Avatar.Root>
                            <div className="board-member-details">
                                <span>{member.displayName}</span>
                                {member.role === "owner" && <small>Owner</small>}
                            </div>
                            {member.role !== "owner" && isOwner && (
                                <RemoveMemberButton
                                    boardId={boardId}
                                    member={member}
                                    onRemoved={refresh}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isOwner && (
                <>
                    <div className="separator" />
                    <fieldset>
                        <label>New member&apos;s username</label>
                        <input
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            onKeyDown={saveOnEnter}
                            autoFocus
                        />
                        <label>Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            onKeyDown={saveOnEnter}
                            autoComplete="new-password"
                        />
                    </fieldset>

                    {createdCredentials && (
                        <div className="dialog-callout">
                            <b>
                                Share the link above plus these with your friend now, since the
                                password won&apos;t be shown again.
                            </b>
                            <div className="board-members-copy-row">
                                <code>{createdCredentials.username}</code>
                                <code>{createdCredentials.password}</code>
                                <Button
                                    variant="secondary"
                                    onClick={() =>
                                        copyToClipboard(
                                            `Board link: ${boardLink}\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`,
                                            "Copied!",
                                        )
                                    }
                                >
                                    <MdContentCopy /> Copy all
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
                {isOwner && (
                    <Button variant="primary" disabled={creating} onClick={handleCreate}>
                        Create login
                    </Button>
                )}
            </div>
        </DialogBase>
    );
});

// Same countdown-confirm pattern as AccountSettingsDialog's delete button, since removing a member
// can outright delete their account, so it deserves the same "are you sure" guard.
const REMOVE_WARNING_DURATION_SECONDS = 10;
const RemoveMemberButton = ({ boardId, member, onRemoved }) => {
    const [startedCountdown, setStartedCountdown] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(REMOVE_WARNING_DURATION_SECONDS);
    const [countdownCleared, setCountdownCleared] = useState(false);

    useEffect(() => {
        if (!startedCountdown) return;
        const countdownInterval = setInterval(() => {
            if (secondsRemaining <= 0) {
                setSecondsRemaining(0);
                clearInterval(countdownInterval);
                setCountdownCleared(true);
                return;
            }
            setSecondsRemaining(secondsRemaining - 1);
        }, 1000);
        return () => clearInterval(countdownInterval);
    }, [secondsRemaining, startedCountdown]);

    async function handleRemove() {
        try {
            await removeBoardMember(boardId, member.id);
            toastSuccess(`Removed ${member.displayName}`);
            await onRemoved();
        } catch (err) {
            toastError(err.message);
        }
    }

    if (!startedCountdown) {
        return (
            <Button variant="danger-secondary" onClick={() => setStartedCountdown(true)}>
                <MdPersonRemove /> Remove
            </Button>
        );
    }

    return (
        <Button variant="danger" disabled={!countdownCleared} onClick={handleRemove}>
            {secondsRemaining > 0 ? `Are you sure? (${secondsRemaining})` : "Yes, Remove"}
        </Button>
    );
};
