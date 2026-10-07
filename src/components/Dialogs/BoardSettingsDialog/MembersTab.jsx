import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import * as Avatar from "@radix-ui/react-avatar";
import {
    MdClose,
    MdContentCopy,
    MdDelete,
    MdEdit,
    MdLink,
    MdLogout,
    MdPerson,
    MdSave,
    MdVisibility,
    MdVisibilityOff,
} from "react-icons/md";
import { Button, IconButton, SimpleTooltip } from "@/components";
import { Dialogs, globalBoardStore, globalDialogStore, userStore } from "@/stores";
import {
    createBoardGuest,
    createBoardGuestLoginLink,
    listBoardGuests,
    removeBoardGuest,
    setBoardGuestPassword,
    signOutBoardGuest,
} from "@/APIUtils.js";
import { GUEST_PASSWORD_MIN_LENGTH } from "#shared/boardLimits.js";
import { toastError, toastSuccess } from "@/Utils";

async function copyToClipboard(text, message) {
    try {
        await navigator.clipboard.writeText(text);
        toastSuccess(message, "", { personal: true });
    } catch (err) {
        toastError("Failed to copy: " + err);
    }
}

// The token is attached after "#" which makes it impossible for bots and so on to read this or go to the server.
// Without a token it opens the password login instead.
function buildGuestInvite(board, username, token, password) {
    const url = `${window.location.origin}/board/${board.shortId}`;
    return [
        `This is your login link for "${board.name}" on Playfrens:`,
        token ? `${url}#${token}` : `${url}/${encodeURIComponent(username)}`,
        "",
        `Username: ${username}`,
        ...(password ? [`Password: ${password}`] : []),
    ].join("\n");
}

// Lists this board's guests and, if you're the owner, lets you create or remove logins.
// For now only works for none-accounts.
export const MembersTab = observer(() => {
    const boardId = globalBoardStore.activeBoardId;
    const activeBoard = globalBoardStore.activeBoard;
    const isOwner = globalBoardStore.isOwner;
    const boardLink = `${window.location.origin}/board/${activeBoard?.shortId ?? boardId}`;

    const cached = globalBoardStore.getCachedGuests(boardId);
    const [guests, setGuests] = useState(cached ?? []);
    const [loading, setLoading] = useState(cached === null);
    const [creating, setCreating] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [latestInvite, setLatestInvite] = useState(null); // { username, password, text }

    async function refresh() {
        setLoading(true);
        try {
            const fetched = await listBoardGuests(boardId);
            // Owner first, everyone else keeps the order the backend returned them in.
            fetched.sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
            setGuests(fetched);
            globalBoardStore.setCachedGuests(boardId, fetched);
        } catch (err) {
            toastError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // Use the cache instead when switching tabs, so we don't spam the service.
        if (globalBoardStore.getCachedGuests(boardId)) return;
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the board changes
    }, [boardId]);

    function showInvite(username, token, password) {
        const text = buildGuestInvite(activeBoard, username, token, password);
        setLatestInvite({ username, password, text });
        return text;
    }

    async function handleCreate() {
        const passwordTooShort = newPassword && newPassword.length < GUEST_PASSWORD_MIN_LENGTH;
        if (creating || !newUsername.trim() || passwordTooShort) return;
        setCreating(true);
        try {
            const result = await createBoardGuest(
                boardId,
                newUsername.trim(),
                newPassword || undefined,
            );
            showInvite(result.guest.username, result.loginLink?.token, result.password);
            if (!result.loginLink) {
                toastError("Couldn't create a login link, try again from their row.");
            }
            setNewUsername("");
            setNewPassword("");
            await refresh();
            await globalBoardStore.refreshBoardsList();
            toastSuccess(`Created a login for ${result.guest.displayName}`);
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

    // No password here, it isn't stored.
    async function handleNewLink(guest) {
        try {
            const { token } = await createBoardGuestLoginLink(boardId, guest.id);
            const text = showInvite(guest.username, token);
            await copyToClipboard(text, `Login link for ${guest.displayName} copied!`);
        } catch (err) {
            toastError(err.message);
        }
    }

    return (
        <>
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
                <small>
                    Anyone who already has a login below can use this to jump to this board.
                </small>
            </div>

            {loading ? (
                <p>Loading members...</p>
            ) : (
                <div className="board-members-list">
                    {guests.map((guest) => (
                        <div className="board-member-row" key={guest.id}>
                            <Avatar.Root className="rx-avatar">
                                <Avatar.Image
                                    src={guest.avatarURL ?? undefined}
                                    referrerPolicy="no-referrer"
                                />
                                <Avatar.Fallback className="rx-avatarless" asChild>
                                    <MdPerson />
                                </Avatar.Fallback>
                            </Avatar.Root>
                            <div className="board-member-details">
                                <span>
                                    {guest.displayName}
                                    {guest.id === userStore.userInfo?.id && " (You)"}
                                </span>
                                <small>{guest.role === "owner" ? "Owner" : "Guest"}</small>
                            </div>
                            {guest.role !== "owner" && (
                                <div className="guest-row-actions">
                                    {(isOwner || guest.id === userStore.userInfo?.id) && (
                                        <GuestPasswordField boardId={boardId} guest={guest} />
                                    )}
                                    {isOwner && (
                                        <>
                                            <SimpleTooltip message="Copy a new login link, the old one stops working">
                                                <IconButton
                                                    icon={<MdLink />}
                                                    aria-label={`New login link for ${guest.displayName}`}
                                                    onClick={() => handleNewLink(guest)}
                                                />
                                            </SimpleTooltip>
                                            <SignOutGuestButton boardId={boardId} guest={guest} />
                                            <RemoveGuestButton
                                                boardId={boardId}
                                                guest={guest}
                                                onRemoved={refresh}
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {isOwner && (
                <>
                    <div className="separator" />
                    <div className="new-guest-section">
                        <div className="dialog-callout">
                            <label>Create New Guest</label>
                            <small>
                                Guest logins let others participate in this board, without making a regular account
                            </small>
                        </div>
                        <fieldset>
                            <label>New Guest&apos;s Username</label>
                            <input
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                onKeyDown={saveOnEnter}
                                autoFocus
                            />
                            <label>Password (optional)</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                onKeyDown={saveOnEnter}
                                autoComplete="new-password"
                            />
                        </fieldset>
                        <Button variant="primary" disabled={creating} onClick={handleCreate}>
                            Create login
                        </Button>
                    </div>

                    {latestInvite && (
                        <div className="dialog-callout">
                            <b>
                                Share this with {latestInvite.username} now, the login link
                                {latestInvite.password && " and password"} won&apos;t be shown
                                again.
                            </b>
                            <div className="board-members-copy-row">
                                <code>{latestInvite.username}</code>
                                {latestInvite.password && <code>{latestInvite.password}</code>}
                                <Button
                                    variant="secondary"
                                    onClick={() => copyToClipboard(latestInvite.text, "Copied!")}
                                >
                                    <MdContentCopy /> Copy all
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </>
    );
});

// Stays masked until edit is clicked, which swaps to a new-password input that can be cancelled.
const GuestPasswordField = ({ boardId, guest }) => {
    const [editing, setEditing] = useState(false);
    const [revealed, setRevealed] = useState(false);
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (editing) inputRef.current?.focus();
    }, [editing]);

    function cancel() {
        setEditing(false);
        setRevealed(false);
        setPassword("");
    }

    async function save() {
        if (saving) return;
        if (password.length < GUEST_PASSWORD_MIN_LENGTH) {
            toastError(`Password must be at least ${GUEST_PASSWORD_MIN_LENGTH} characters.`);
            return;
        }
        setSaving(true);
        try {
            await setBoardGuestPassword(boardId, guest.id, password);
            toastSuccess(`Changed ${guest.displayName}'s password`);
            cancel();
        } catch (err) {
            toastError(err.message);
        } finally {
            setSaving(false);
        }
    }

    const onKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            save();
        } else if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation(); // don't close the dialog
            cancel();
        }
    };

    return (
        <div className="guest-password-field">
            <div className="guest-password-input">
                <input
                    ref={inputRef}
                    type={editing && revealed ? "text" : "password"}
                    value={editing ? password : "••••••••"}
                    placeholder="New password"
                    disabled={!editing}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={onKeyDown}
                    autoComplete="new-password"
                    aria-label={`Password for ${guest.displayName}`}
                />
                {editing && (
                    <SimpleTooltip message={revealed ? "Hide" : "Reveal"}>
                        <IconButton
                            className="guest-password-reveal"
                            icon={revealed ? <MdVisibilityOff /> : <MdVisibility />}
                            aria-label={revealed ? "Hide password" : "Reveal password"}
                            onClick={() => setRevealed(!revealed)}
                        />
                    </SimpleTooltip>
                )}
            </div>
            <div className="guest-password-actions">
                {editing ? (
                    <>
                        <SimpleTooltip message="Save">
                            <IconButton
                                icon={<MdSave />}
                                aria-label="Save password"
                                disabled={saving}
                                onClick={save}
                            />
                        </SimpleTooltip>
                        <SimpleTooltip message="Cancel">
                            <IconButton
                                icon={<MdClose />}
                                aria-label="Cancel"
                                disabled={saving}
                                onClick={cancel}
                            />
                        </SimpleTooltip>
                    </>
                ) : (
                    <SimpleTooltip message="Change password">
                        <IconButton
                            icon={<MdEdit />}
                            aria-label="Change password"
                            onClick={() => setEditing(true)}
                        />
                    </SimpleTooltip>
                )}
            </div>
        </div>
    );
};

const SignOutGuestButton = ({ boardId, guest }) => {
    async function handleSignOut() {
        try {
            await signOutBoardGuest(boardId, guest.id);
            toastSuccess(`Signed out ${guest.displayName} everywhere`);
        } catch (err) {
            toastError(err.message);
        }
    }

    return (
        <SimpleTooltip message="Sign out everywhere">
            <IconButton
                icon={<MdLogout />}
                aria-label={`Sign out ${guest.displayName} everywhere`}
                onClick={() =>
                    globalDialogStore.open(Dialogs.GenericWarning, {
                        message: `Sign ${guest.displayName} out on every device and cancel their login link? A password, if they have one, keeps working.`,
                        continueFunction: handleSignOut,
                    })
                }
            />
        </SimpleTooltip>
    );
};

const RemoveGuestButton = ({ boardId, guest, onRemoved }) => {
    async function handleRemove() {
        try {
            await removeBoardGuest(boardId, guest.id);
            toastSuccess(`Removed ${guest.displayName}`);
            await onRemoved();
        } catch (err) {
            toastError(err.message);
        }
    }

    return (
        <SimpleTooltip message="Remove guest">
            <IconButton
                className="guest-remove-button"
                icon={<MdDelete />}
                aria-label={`Remove ${guest.displayName}`}
                onClick={() =>
                    globalDialogStore.open(Dialogs.DeleteWarning, {
                        itemName: guest.displayName,
                        description: "Their login will be deleted and they'll be signed out.",
                        countdownSeconds: 5,
                        deleteFunction: handleRemove,
                    })
                }
            />
        </SimpleTooltip>
    );
};
