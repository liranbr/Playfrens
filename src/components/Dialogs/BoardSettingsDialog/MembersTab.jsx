import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import * as Avatar from "@radix-ui/react-avatar";
import {
    MdAutorenew,
    MdClose,
    MdContentCopy,
    MdDelete,
    MdLogout,
    MdMoreVert,
    MdPassword,
    MdPerson,
    MdPersonAdd,
    MdSave,
    MdVisibility,
    MdVisibilityOff,
} from "react-icons/md";
import { Button, Dropdown, IconButton, LabelBadge, SimpleTooltip } from "@/components";
import { Dialogs, globalBoardStore, globalDialogStore, userStore } from "@/stores";
import {
    createBoardGuest,
    getBoardGuestLoginLink,
    listBoardUsers,
    removeBoardGuest,
    replaceBoardGuestLoginLink,
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

// Lists this board's users and, if you're the owner, lets you create or remove guest logins.
export const MembersTab = observer(() => {
    const boardId = globalBoardStore.activeBoardId;
    const activeBoard = globalBoardStore.activeBoard;
    const isOwner = globalBoardStore.isOwner;
    const boardLink = `${window.location.origin}/board/${activeBoard?.shortId ?? boardId}`;

    const cached = globalBoardStore.getCachedUsers(boardId);
    const [users, setUsers] = useState(cached ?? []);
    const [loading, setLoading] = useState(cached === null);
    const [creating, setCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [latestInvite, setLatestInvite] = useState(null); // { username, password, text }
    const [editingPasswordFor, setEditingPasswordFor] = useState(null); // guest id

    async function refresh() {
        setLoading(true);
        try {
            const fetched = await listBoardUsers(boardId);
            // Owner first, everyone else keeps the order the backend returned them in.
            fetched.sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0));
            setUsers(fetched);
            globalBoardStore.setCachedUsers(boardId, fetched);
        } catch (err) {
            toastError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        // Use the cache instead when switching tabs, so we don't spam the service.
        if (globalBoardStore.getCachedUsers(boardId)) return;
        refresh();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the board changes
    }, [boardId]);

    function closeCreateForm() {
        setShowCreateForm(false);
        setNewUsername("");
        setNewPassword("");
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
            const { username } = result.guest;
            setLatestInvite({
                username, password: result.password, text: buildGuestInvite(activeBoard, username, result.loginLink?.token, result.password,),
            });
            if (!result.loginLink) {
                toastError("Couldn't create a login link, try again from their row.");
            }
            closeCreateForm();
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
    async function handleCopyLink(guest) {
        try {
            const { token } = await getBoardGuestLoginLink(boardId, guest.id);
            const text = buildGuestInvite(activeBoard, guest.username, token);
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
                    {users.map((user) => (
                        <div className="board-member-row" key={user.id}>
                            <Avatar.Root className="rx-avatar">
                                <Avatar.Image
                                    src={user.avatarURL ?? undefined}
                                    referrerPolicy="no-referrer"
                                />
                                <Avatar.Fallback className="rx-avatarless" asChild>
                                    <MdPerson />
                                </Avatar.Fallback>
                            </Avatar.Root>
                            <div className="board-member-details">
                                <span>
                                    {user.displayName}
                                    {user.id === userStore.userInfo?.id && " (You)"}
                                </span>
                                <small>{user.role === "owner" ? "Owner" : "Guest"}</small>
                            </div>
                            {user.role === "guest" && (
                                <div className="guest-row-actions">
                                    {editingPasswordFor === user.id ? (
                                        <GuestPasswordField
                                            boardId={boardId}
                                            guest={user}
                                            onDone={() => setEditingPasswordFor(null)}
                                        />
                                    ) : (
                                        <>
                                            {isOwner && (
                                                <SimpleTooltip message="Copy login link">
                                                    <IconButton
                                                        icon={<MdContentCopy />}
                                                        aria-label={`Copy login link for ${user.displayName}`}
                                                        onClick={() => handleCopyLink(user)}
                                                    />
                                                </SimpleTooltip>
                                            )}
                                            {(isOwner || user.id === userStore.userInfo?.id) && (
                                                <GuestMenu
                                                    boardId={boardId}
                                                    guest={user}
                                                    isOwner={isOwner}
                                                    onChangePassword={() =>
                                                        setEditingPasswordFor(user.id)
                                                    }
                                                    onRemoved={refresh}
                                                />
                                            )}
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
                        {showCreateForm ? (
                            <>
                                <fieldset>
                                    <label>New Guest&apos;s Username</label>
                                    <input
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        onKeyDown={saveOnEnter}
                                        autoFocus
                                    />
                                    <label>
                                        Password
                                        <LabelBadge />
                                    </label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        onKeyDown={saveOnEnter}
                                        autoComplete="new-password"
                                    />
                                </fieldset>
                                <div className="new-guest-actions">
                                    <Button
                                        variant="primary"
                                        disabled={creating}
                                        onClick={handleCreate}
                                    >
                                        Create login
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        disabled={creating}
                                        onClick={closeCreateForm}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </>
                        ) : (
                            <div className="new-guest-actions">
                                <Button variant="secondary" onClick={() => setShowCreateForm(true)}>
                                    <MdPersonAdd /> New guest
                                </Button>
                            </div>
                        )}
                    </div>

                    {latestInvite && (
                        <div className="dialog-callout">
                            <b>
                                Share this with {latestInvite.username}
                                {latestInvite.password && " now, the password won't be shown again"}
                                .
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

// Opened from the guest's menu, closes on save or cancel.
const GuestPasswordField = ({ boardId, guest, onDone }) => {
    const [revealed, setRevealed] = useState(false);
    const [password, setPassword] = useState("");
    const [saving, setSaving] = useState(false);

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
            onDone();
        } catch (err) {
            toastError(err.message);
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
            onDone();
        }
    };

    return (
        <div className="guest-password-field">
            <div className="guest-password-input">
                <input
                    autoFocus
                    type={revealed ? "text" : "password"}
                    value={password}
                    placeholder="New password"
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={onKeyDown}
                    autoComplete="new-password"
                    aria-label={`New password for ${guest.displayName}`}
                />
                <SimpleTooltip message={revealed ? "Hide" : "Reveal"}>
                    <IconButton
                        className="guest-password-reveal"
                        icon={revealed ? <MdVisibilityOff /> : <MdVisibility />}
                        aria-label={revealed ? "Hide password" : "Reveal password"}
                        onClick={() => setRevealed(!revealed)}
                    />
                </SimpleTooltip>
            </div>
            <div className="guest-password-actions">
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
                        onClick={onDone}
                    />
                </SimpleTooltip>
            </div>
        </div>
    );
};

// Everything except copying the link, guests only get Change password for themselves.
const GuestMenu = ({ boardId, guest, isOwner, onChangePassword, onRemoved }) => {
    const [open, setOpen] = useState(false);
    const name = guest.displayName;

    function confirmThen(message, action, successMessage) {
        globalDialogStore.open(Dialogs.GenericWarning, {
            message,
            continueFunction: async () => {
                try {
                    await action();
                    toastSuccess(successMessage);
                } catch (err) {
                    toastError(err.message);
                }
            },
        });
    }

    async function handleRemove() {
        try {
            await removeBoardGuest(boardId, guest.id);
            toastSuccess(`Removed ${name}`);
            await onRemoved();
        } catch (err) {
            toastError(err.message);
        }
    }

    return (
        <Dropdown
            trigger={
                <IconButton icon={<MdMoreVert />} activate={open} aria-label={`More for ${name}`} />
            }
            open={open}
            onOpenChange={setOpen}
            align="end"
        >
            {isOwner && (
                <Dropdown.Item
                    onSelect={() =>
                        confirmThen(
                            `Make a new login link for ${name}? Their current link stops working.`,
                            () => replaceBoardGuestLoginLink(boardId, guest.id),
                            `Replaced ${name}'s login link`,
                        )
                    }
                >
                    <MdAutorenew /> Replace login link
                </Dropdown.Item>
            )}
            <Dropdown.Item onSelect={onChangePassword}>
                <MdPassword /> Change password
            </Dropdown.Item>
            {isOwner && (
                <>
                    <Dropdown.Item
                        onSelect={() =>
                            confirmThen(
                                `Sign ${name} out on every device and cancel their login link? A password, if they have one, keeps working.`,
                                () => signOutBoardGuest(boardId, guest.id),
                                `Signed out ${name} everywhere`,
                            )
                        }
                    >
                        <MdLogout /> Sign out everywhere
                    </Dropdown.Item>
                    <Dropdown.Separator />
                    <Dropdown.Item
                        data-danger
                        onSelect={() =>
                            globalDialogStore.open(Dialogs.DeleteWarning, {
                                itemName: name,
                                description:
                                    "Their login will be deleted and they'll be signed out.",
                                countdownSeconds: 5,
                                deleteFunction: handleRemove,
                            })
                        }
                    >
                        <MdDelete /> Remove guest
                    </Dropdown.Item>
                </>
            )}
        </Dropdown>
    );
};
