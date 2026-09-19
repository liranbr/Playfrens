import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import * as Avatar from "@radix-ui/react-avatar";
import { MdContentCopy, MdPerson, MdPersonRemove } from "react-icons/md";
import { Button } from "@/components";
import { globalBoardStore, userStore } from "@/stores";
import { createBoardGuest, listBoardGuests, removeBoardGuest } from "@/APIUtils.js";
import { toastError, toastSuccess } from "@/Utils";

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
    const [createdCredentials, setCreatedCredentials] = useState(null);

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

    async function handleCreate() {
        if (creating || !newUsername.trim() || newPassword.length < 8) return;
        setCreating(true);
        try {
            const result = await createBoardGuest(boardId, newUsername.trim(), newPassword);
            setCreatedCredentials({ username: result.guest.username, password: result.password });
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

    async function copyToClipboard(text, message) {
        try {
            await navigator.clipboard.writeText(text);
            toastSuccess(message);
        } catch (err) {
            toastError("Failed to copy: " + err);
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
                <small>Anyone who already has a login below can use this to jump to this board.</small>
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
                            {guest.role !== "owner" && isOwner && (
                                <RemoveGuestButton
                                    boardId={boardId}
                                    guest={guest}
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
                    <div className="new-guest-section">
                        <div className="dialog-callout">
                            <label>Create new guest</label>
                            <small>
                                A guest login allows people without an account participate onto this board.
                            </small>
                        </div>
                        <fieldset>
                            <label>New guest&apos;s username</label>
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
                        <Button variant="primary" disabled={creating} onClick={handleCreate}>
                            Create login
                        </Button>
                    </div>

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
                                            `Board link: ${boardLink}/${encodeURIComponent(createdCredentials.username)}\nUsername: ${createdCredentials.username}\nPassword: ${createdCredentials.password}`,
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
        </>
    );
});

// Gave it the same behavior as deleting accounts so it won't be accidental.
const REMOVE_WARNING_DURATION_SECONDS = 10;
const RemoveGuestButton = ({ boardId, guest, onRemoved }) => {
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
            await removeBoardGuest(boardId, guest.id);
            toastSuccess(`Removed ${guest.displayName}`);
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
