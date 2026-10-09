import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import {
    GUEST_PASSWORD_MIN_LENGTH,
    MAX_BOARD_HISTORY_ENTRIES,
    MAX_BOARD_HISTORY_MESSAGE_LENGTH,
    MAX_OWNED_BOARDS,
} from "#shared/boardLimits.js";
import {
    sanitizeBoardValue,
    validateBoardData,
    validateBoardValue,
} from "#shared/boardValidation.js";
import { Response } from "../response.js";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../auth/requireAuth.js";
import { requireBoardAccess, permissionLevel } from "../auth/requireBoardAccess.js";
import {
    deleteGuestRow,
    insertBoard,
    insertGuest,
    removeOrphanedBoardGuests,
} from "../auth/passport.js";
import {
    cancelGuestLoginLink,
    createGuestLoginLink,
    getGuestLoginLink,
} from "../auth/guestLoginLinks.js";
import { destroyUserSessions } from "../auth/SupabaseSessionStore.js";
import { broadcastToBoard, closeUserSockets } from "../ws/boardSocket.js";

// Lists boards the caller can access, their own plus any they've joined.
async function listBoards(req, res) {
    const { OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const userId = req.user.id;

    const { data: boards, error } = await supabase
        .from("boards")
        .select(
            "id, name, short_id, owner_id, is_public, owner:owner_id(id, display_name, avatar_url)",
        )
        .or(`owner_id.eq.${userId},members_id.cs.{${userId}}`);

    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });

    const list = boards.map((b) => ({
        id: b.id,
        shortId: b.short_id, // used to build the /app/<shortId> URL instead of the raw UUID
        role: b.owner_id === userId ? "owner" : "guest",
        isPublic: b.is_public === true,
        owner: {
            id: b.owner_id,
            displayName: b.owner?.display_name ?? "Unknown",
            avatarURL: b.owner?.avatar_url ?? null,
        },
        name:
            b.name ||
            (b.owner_id === userId ? "My Board" : `${b.owner?.display_name ?? "Unknown"}'s Board`),
    }));
    return Response.send(res, OK, { boards: list });
}

async function createBoard(req, res) {
    const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { name } = req.body;

    const { count, error: countError } = await supabase
        .from("boards")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", req.user.id);
    if (countError) return Response.send(res, INTERNAL_SERVER_ERROR, { error: countError.message });
    if (count >= MAX_OWNED_BOARDS) {
        return Response.send(res, BAD_REQUEST, {
            error: `You can only own up to ${MAX_OWNED_BOARDS} boards.`,
        });
    }

    const board = await insertBoard(req.user.id, name?.trim() || null);
    if (!board) {
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: "Failed to create board." });
    }

    return Response.send(res, OK, {
        board: {
            id: board.id,
            shortId: board.short_id,
            name: board.name || "My Board",
            role: "owner",
        },
    });
}

/** GET /:boardId (access is already resolved and the row already loaded by requireBoardAccess). */
async function getBoard(req, res) {
    const { OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

    const boardIsEmpty = Object.keys(req.board.board ?? {}).length === 0;
    const ownerId = req.board.owner_id;
    const hasOwnerTag =
        !boardIsEmpty &&
        (req.board.board.allFriends ?? []).some(([, json]) =>
            json?.linkedAccountIds?.includes(ownerId),
        );
    if (!boardIsEmpty && !hasOwnerTag) {
        const { data: owner, error } = await supabase
            .from("users")
            .select("display_name")
            .eq("id", ownerId)
            .single();
        if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });
        await ensureLinkedFriendTag(req.board, ownerId, owner.display_name);
    }

    return Response.send(res, OK, { board: req.board });
}

/** Replaces the entire board's data blob. Receives { data }. */
async function saveBoard(req, res) {
    const { OK, BAD_REQUEST } = Response.HttpStatus;
    const data = sanitizeBoardValue(req.body.data);
    if (!data) return Response.send(res, BAD_REQUEST, { error: "Missing board data" });
    const invalid = validateBoardData(data);
    if (invalid) return Response.send(res, BAD_REQUEST, { error: invalid });

    // Return the stored last_updated, since the client tracks it to detect stale writes.
    const { data: updated, error } = await supabase
        .from("boards")
        .update({ board: data, last_updated: new Date() })
        .eq("id", req.board.id)
        .select("last_updated")
        .single();
    if (error) throw error;

    broadcastToBoard(req.board.id, {
        type: "board-replace",
        board: data,
        lastUpdated: updated.last_updated,
    });
    return Response.send(res, OK, {
        message: "Board updated successfully",
        lastUpdated: updated.last_updated,
    });
}

async function renameBoard(req, res) {
    const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
        return Response.send(res, BAD_REQUEST, { error: "A board name is required." });
    }

    const trimmed = name.trim();
    const { error } = await supabase
        .from("boards")
        .update({ name: trimmed })
        .eq("id", req.board.id);
    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });

    broadcastToBoard(req.board.id, { type: "board-renamed", name: trimmed });
    return Response.send(res, OK, { name: trimmed });
}

// Only owners can change these, no one else!
const OWNER_ONLY_BOARD_KEYS = ["settings", "defaultFilters"];

// Guests can edit/reorder/remove entries in these collections but cannot add new ones.
const GUEST_NO_ADD_KEYS = ["allGames", "allFriends", "allCategories", "allStatuses"];

// Anything outside this list only changes through a full save (e.g. restore from backup).
const WRITABLE_BOARD_KEYS = [
    ...OWNER_ONLY_BOARD_KEYS,
    ...GUEST_NO_ADD_KEYS,
    "allReminders",
    "tagsCustomOrders",
];

function preserveLinkedAccountIds(storedFriends, incomingFriends) {
    const storedById = new Map((storedFriends ?? []).map(([id, json]) => [id, json]));
    return incomingFriends.map(([id, json]) => {
        const linkedAccountIds = storedById.get(id)?.linkedAccountIds ?? [];
        return [id, { ...json, linkedAccountIds }];
    });
}

/**
 * Updates a board JSONB key via RPC. `expectedLastUpdated`, when sent, rejects the write with 409
 * if the board changed since the client last saw it, instead of silently overwriting someone
 * else's change.
 */
async function updateBoard(req, res) {
    const { OK, BAD_REQUEST, FORBIDDEN, CONFLICT } = Response.HttpStatus;
    const { path, expectedLastUpdated } = req.body;
    let { value } = req.body;
    if (!Array.isArray(path) || path.length !== 1 || value === undefined) {
        return Response.send(res, BAD_REQUEST, { error: "Invalid partial update payload" });
    }
    if (!WRITABLE_BOARD_KEYS.includes(path[0])) {
        return Response.send(res, BAD_REQUEST, { error: "That board key can't be updated." });
    }
    value = sanitizeBoardValue(value);
    const invalid = validateBoardValue(path[0], value);
    if (invalid) return Response.send(res, BAD_REQUEST, { error: invalid });
    if (OWNER_ONLY_BOARD_KEYS.includes(path[0]) && !req.isBoardOwner) {
        return Response.send(res, FORBIDDEN, { error: "Only the board owner can change this." });
    }
    if (GUEST_NO_ADD_KEYS.includes(path[0]) && !req.isBoardOwner) {
        const collectionIds = (value) => {
            return new Set((Array.isArray(value) ? value : []).map((entry) => entry?.[0]));
        };
        const existingIds = collectionIds(req.board.board[path[0]]);
        const incomingIds = collectionIds(value);
        const addsNewEntry = [...incomingIds].some((id) => !existingIds.has(id));
        if (addsNewEntry) {
            return Response.send(res, FORBIDDEN, {
                error: "Only the board owner can add new games or tags.",
            });
        }
        if (path[0] === "allFriends") {
            value = preserveLinkedAccountIds(req.board.board.allFriends, value);
        }
    }

    // Returns the new last_updated on success, or null if expectedLastUpdated didn't match.
    const { data: newLastUpdated, error } = await supabase.rpc("update_board_path", {
        _board_id: req.board.id,
        _path: path,
        _value: value,
        _expected_last_updated: expectedLastUpdated ?? null,
    });
    if (error) throw error;

    if (!newLastUpdated) {
        return Response.send(res, CONFLICT, {
            error: "Board changed since your last sync, please retry.",
            code: Response.ErrorCode.STALE_WRITE,
        });
    }

    broadcastToBoard(req.board.id, {
        type: "board-update",
        path,
        value,
        lastUpdated: newLastUpdated,
    });
    return Response.send(res, OK, {
        message: "Board updated (partial)",
        lastUpdated: newLastUpdated,
    });
}

/** Appends an activity entry, author and date are stamped here so they can't be spoofed. */
async function appendBoardHistory(req, res) {
    const { OK, BAD_REQUEST } = Response.HttpStatus;
    const { message, gameLink } = req.body;
    if (typeof message !== "string" || !message.trim()) {
        return Response.send(res, BAD_REQUEST, { error: "A history message is required." });
    }

    const entry = {
        id: uuidv4(),
        message: message.trim().slice(0, MAX_BOARD_HISTORY_MESSAGE_LENGTH),
        date: new Date().toISOString(),
        author: { id: req.user.id, name: req.user.display_name ?? "Unknown" },
        gameLink:
            typeof gameLink?.gameID === "string"
                ? {
                      gameID: gameLink.gameID,
                      partyID: typeof gameLink.partyID === "string" ? gameLink.partyID : undefined,
                  }
                : null,
    };

    const { error } = await supabase.rpc("append_board_history", {
        _board_id: req.board.id,
        _entry: entry,
        _max: MAX_BOARD_HISTORY_ENTRIES,
    });
    if (error) throw error;

    broadcastToBoard(req.board.id, { type: "board-history", entry });
    return Response.send(res, OK, { entry });
}

async function deleteBoard(req, res) {
    const { OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

    // Clean up guest accounts made specifically for this board before it disappears.
    await removeOrphanedBoardGuests(req.board.id, "This board was deleted.");

    const { error } = await supabase.from("boards").delete().eq("id", req.board.id);
    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });

    broadcastToBoard(req.board.id, { type: "board-deleted" });
    return Response.send(res, OK, { message: "Board deleted" });
}

/**
 * Persists a new `allFriends` array and broadcasts it, mutating `board.board.allFriends` in place
 * so the caller's already-loaded copy (e.g. the response about to be sent) reflects it too.
 */
async function persistAndBroadcastFriends(board, updatedFriends) {
    const { data: newLastUpdated, error } = await supabase.rpc("update_board_path", {
        _board_id: board.id,
        _path: ["allFriends"],
        _value: updatedFriends,
        _expected_last_updated: null,
    });
    if (error) throw error;

    board.board.allFriends = updatedFriends;
    if (newLastUpdated) board.last_updated = newLastUpdated;
    broadcastToBoard(board.id, {
        type: "board-update",
        path: ["allFriends"],
        value: updatedFriends,
        lastUpdated: newLastUpdated,
    });
}

/** Finds (or lazily creates + persists) a FriendTagObject json linked to accountId. */
async function ensureLinkedFriendTag(board, accountId, displayName) {
    const allFriends = board.board.allFriends ?? [];
    const existing = allFriends.find(([, json]) => json?.linkedAccountIds?.includes(accountId));
    if (existing) return existing[1];

    const tagJson = {
        type: "friend",
        id: uuidv4(),
        name: displayName,
        steamID: "",
        iconURL: "",
        linkedAccountIds: [accountId],
    };
    await persistAndBroadcastFriends(board, [...allFriends, [tagJson.id, tagJson]]);
    return tagJson;
}

/**
 * Removes accountId from every tag's linkedAccountIds. Tags aren't deleted here, they may still
 * be a meaningful free-form tag, or shared with other linked accounts.
 */
async function unlinkAccountFromAllTags(board, accountId) {
    const allFriends = board.board.allFriends ?? [];
    if (!allFriends.some(([, json]) => json?.linkedAccountIds?.includes(accountId))) return;

    const updatedFriends = allFriends.map(([id, json]) => {
        if (!json?.linkedAccountIds?.includes(accountId)) return [id, json];
        return [
            id,
            { ...json, linkedAccountIds: json.linkedAccountIds.filter((a) => a !== accountId) },
        ];
    });
    await persistAndBroadcastFriends(board, updatedFriends);
}

/** GET /:boardId/users (owner + every guest's public profile fields). */
async function listBoardUsers(req, res) {
    const { OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

    const { data: owner, error: ownerError } = await supabase
        .from("users")
        .select("id, display_name, avatar_url")
        .eq("id", req.board.owner_id)
        .single();
    if (ownerError) return Response.send(res, INTERNAL_SERVER_ERROR, { error: ownerError.message });

    const memberIds = req.board.members_id ?? [];
    const { data: guestRows, error: guestsError } = memberIds.length
        ? await supabase
              .from("guests")
              .select("id, display_name, member_username")
              .in("id", memberIds)
        : { data: [], error: null };
    if (guestsError)
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: guestsError.message });

    const users = [
        {
            id: owner.id,
            displayName: owner.display_name,
            avatarURL: owner.avatar_url,
            username: null,
            role: "owner",
        },
        ...guestRows.map((g) => ({
            id: g.id,
            displayName: g.display_name,
            avatarURL: null,
            username: g.member_username,
            role: "guest",
        })),
    ];
    return Response.send(res, OK, { users });
}

/**
 * Creates a "board guest" login for this board, with a login link and an optional password.
 */
async function createGuest(req, res) {
    const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { username, password } = req.body;
    if (!username || typeof username !== "string" || !username.trim()) {
        return Response.send(res, BAD_REQUEST, { error: "A username is required." });
    }
    const hasPassword = password !== undefined && password !== null && password !== "";
    if (
        hasPassword &&
        (typeof password !== "string" || password.length < GUEST_PASSWORD_MIN_LENGTH)
    ) {
        return Response.send(res, BAD_REQUEST, {
            error: `Password must be at least ${GUEST_PASSWORD_MIN_LENGTH} characters.`,
        });
    }

    // Usernames only need to be unique to the board.
    const { data: existing } = await supabase
        .from("guests")
        .select("id")
        .eq("member_username", username)
        .eq("home_board_id", req.board.id)
        .maybeSingle();
    if (existing) {
        return Response.send(res, BAD_REQUEST, {
            error: "That username is already taken on this board.",
        });
    }

    // Supabase Auth needs a valid email, regardless, let's throw a random value for it.
    const localEmail = `${uuidv4()}@guests.playfrens.local`;
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: localEmail,
        ...(hasPassword && { password }),
        email_confirm: true,
    });
    if (createError) {
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: createError.message });
    }

    let guest;
    try {
        guest = await insertGuest(req.board.id, username, created.user.id);
    } catch (err) {
        await supabase.auth.admin.deleteUser(created.user.id).catch(() => {});
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }

    const { error: guestError } = await supabase.rpc("add_board_member", {
        _board_id: req.board.id,
        _user_id: guest.id,
    });
    if (guestError) {
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: guestError.message });
    }
    await ensureLinkedFriendTag(req.board, guest.id, username);

    // Not fatal, the owner can make a new link later.
    let loginLink = null;
    try {
        loginLink = await createGuestLoginLink(guest.id);
    } catch (err) {
        console.error("Error creating guest login link:", err);
    }

    broadcastToBoard(req.board.id, { type: "users-changed" });
    return Response.send(res, OK, {
        guest: { id: guest.id, displayName: username, username },
        // Both shown once here for the inviter to share out-of-band, never stored by us.
        password: hasPassword ? password : null,
        loginLink, // { token }
    });
}

async function findBoardGuest(boardId, guestId) {
    const { data: guest } = await supabase
        .from("guests")
        .select("id")
        .eq("id", guestId)
        .eq("home_board_id", boardId)
        .maybeSingle();
    return guest;
}

/** The guest's current login link { token }, made if they don't have one yet. */
async function getGuestLink(req, res) {
    const { OK, BAD_REQUEST, CONFLICT, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const guest = await findBoardGuest(req.board.id, req.params.userId);
    if (!guest) return Response.send(res, BAD_REQUEST, { error: "That guest doesn't exist." });

    try {
        const loginLink = await getGuestLoginLink(guest.id);
        if (loginLink && !loginLink.token) {
            return Response.send(res, CONFLICT, {
                error: "This login link can't be copied, replace it to get a new one.",
            });
        }
        return Response.send(res, OK, {
            loginLink: loginLink ?? (await createGuestLoginLink(guest.id)),
        });
    } catch (err) {
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

/** Replaces the guest's login link, returns { token }. */
async function replaceGuestLink(req, res) {
    const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const guest = await findBoardGuest(req.board.id, req.params.userId);
    if (!guest) return Response.send(res, BAD_REQUEST, { error: "That guest doesn't exist." });

    try {
        return Response.send(res, OK, { loginLink: await createGuestLoginLink(guest.id) });
    } catch (err) {
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

/** Signs a guest out everywhere and cancels their login link. */
async function signOutGuest(req, res) {
    const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const guest = await findBoardGuest(req.board.id, req.params.userId);
    if (!guest) return Response.send(res, BAD_REQUEST, { error: "That guest doesn't exist." });

    try {
        await cancelGuestLoginLink(guest.id);
        await destroyUserSessions(guest.id);
    } catch (err) {
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
    closeUserSockets(guest.id, "The board owner signed you out.");
    return Response.send(res, OK, { message: "Guest signed out" });
}

/**
 * Removes a guest from this board
 */
async function removeGuest(req, res) {
    const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { userId } = req.params;
    const { data: guest, error: fetchError } = await supabase
        .from("guests")
        .select("*")
        .eq("id", userId)
        .eq("home_board_id", req.board.id)
        .single();
    if (fetchError || !guest) {
        return Response.send(res, BAD_REQUEST, { error: "That guest doesn't exist." });
    }

    try {
        await deleteGuestRow(guest); // also strips them from every board's members_id
    } catch (err) {
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
    await unlinkAccountFromAllTags(req.board, guest.id);

    // Kick their live connection immediately instead of waiting for their next request to fail.
    closeUserSockets(guest.id, "This account was removed.");

    broadcastToBoard(req.board.id, { type: "users-changed" });
    return Response.send(res, OK, { message: "Guest removed" });
}

/** Sets a new password for a guest login */
async function setGuestPassword(req, res) {
    const { OK, BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { userId } = req.params;
    const { password } = req.body;
    if (!req.isBoardOwner && req.user.id !== userId) {
        return Response.send(res, FORBIDDEN, { error: "You can't change this guest's password." });
    }
    if (!password || typeof password !== "string" || password.length < GUEST_PASSWORD_MIN_LENGTH) {
        return Response.send(res, BAD_REQUEST, {
            error: `Password must be at least ${GUEST_PASSWORD_MIN_LENGTH} characters.`,
        });
    }

    // Guests can change their own password from any board, owners only for guests of their board.
    let query = supabase.from("guests").select("auth_user_id").eq("id", userId);
    if (req.user.id !== userId) query = query.eq("home_board_id", req.board.id);
    const { data: guest, error: fetchError } = await query.maybeSingle();
    if (fetchError || !guest) {
        return Response.send(res, BAD_REQUEST, { error: "That guest doesn't exist." });
    }

    const { error } = await supabase.auth.admin.updateUserById(guest.auth_user_id, { password });
    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });
    return Response.send(res, OK, { message: "Password updated" });
}

/**
 * Assigns/unassigns an account onto a friend tag. Owner-only: any account in linkedAccountIds can
 * self-join/leave and manage the tag, so growing/shrinking that list is kept owner-gated.
 */
async function assignAccountToTag(req, res) {
    const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { tagId } = req.params;
    const { accountId } = req.body;
    if (!accountId || typeof accountId !== "string") {
        return Response.send(res, BAD_REQUEST, { error: "An accountId is required." });
    }
    const isValidAccount =
        accountId === req.board.owner_id || (req.board.members_id ?? []).includes(accountId);
    if (!isValidAccount) {
        return Response.send(res, BAD_REQUEST, { error: "That account isn't on this board." });
    }

    const allFriends = req.board.board.allFriends ?? [];
    const entry = allFriends.find(([id]) => id === tagId);
    if (!entry || entry[1]?.type !== "friend") {
        return Response.send(res, BAD_REQUEST, { error: "That tag doesn't exist." });
    }

    const [, tagJson] = entry;
    const linkedAccountIds = tagJson.linkedAccountIds ?? [];
    if (linkedAccountIds.includes(accountId)) {
        return Response.send(res, OK, { linkedAccountIds });
    }

    try {
        const updatedTagJson = { ...tagJson, linkedAccountIds: [...linkedAccountIds, accountId] };
        const updatedFriends = allFriends.map(([id, json]) =>
            id === tagId ? [id, updatedTagJson] : [id, json],
        );
        await persistAndBroadcastFriends(req.board, updatedFriends);
        return Response.send(res, OK, { linkedAccountIds: updatedTagJson.linkedAccountIds });
    } catch (err) {
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

async function unassignAccountFromTag(req, res) {
    const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { tagId, accountId } = req.params;

    const allFriends = req.board.board.allFriends ?? [];
    const entry = allFriends.find(([id]) => id === tagId);
    if (!entry || entry[1]?.type !== "friend") {
        return Response.send(res, BAD_REQUEST, { error: "That tag doesn't exist." });
    }

    const [, tagJson] = entry;
    try {
        const updatedTagJson = {
            ...tagJson,
            linkedAccountIds: (tagJson.linkedAccountIds ?? []).filter((id) => id !== accountId),
        };
        const updatedFriends = allFriends.map(([id, json]) =>
            id === tagId ? [id, updatedTagJson] : [id, json],
        );
        await persistAndBroadcastFriends(req.board, updatedFriends);
        return Response.send(res, OK, { linkedAccountIds: updatedTagJson.linkedAccountIds });
    } catch (err) {
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

// Board keys a public viewer gets
const PUBLIC_BOARD_KEYS = [
    "allFriends",
    "allCategories",
    "allStatuses",
    "allGames",
    "allReminders",
    "tagsCustomOrders",
    "settings",
    "defaultFilters",
    "version",
];

/** GET /public/:shortId - only for boards the owner made public. */
async function getPublicBoard(req, res) {
    const { OK, NOT_FOUND, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { data: row, error } = await supabase
        .from("boards")
        .select(
            "id, short_id, name, board, last_updated, is_public, owner:owner_id(display_name, avatar_url)",
        )
        .eq("short_id", req.params.shortId)
        .maybeSingle();
    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });
    // Same response for private and missing, so private boards can't be probed for
    if (!row?.is_public) return Response.send(res, NOT_FOUND, { error: "Board not found" });

    const source = row.board ?? {};
    const board = {};
    for (const key of PUBLIC_BOARD_KEYS) if (key in source) board[key] = source[key];
    // Account ids are private, the tags themselves stay
    if (Array.isArray(board.allFriends)) {
        board.allFriends = board.allFriends.map(([id, json]) => {
            const rest = { ...json };
            delete rest.linkedAccountIds;
            return [id, rest];
        });
    }

    const ownerName = row.owner?.display_name ?? "Unknown";
    return Response.send(res, OK, {
        board: {
            id: row.id,
            shortId: row.short_id,
            name: row.name || `${ownerName}'s Board`,
            // No owner id, account ids stay private here
            owner: { displayName: ownerName, avatarURL: row.owner?.avatar_url ?? null },
            last_updated: row.last_updated,
            board,
        },
    });
}

async function setBoardVisibility(req, res) {
    const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const { isPublic } = req.body;
    if (typeof isPublic !== "boolean") {
        return Response.send(res, BAD_REQUEST, { error: "isPublic must be true or false." });
    }

    const { error } = await supabase
        .from("boards")
        .update({ is_public: isPublic })
        .eq("id", req.board.id);
    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });

    broadcastToBoard(req.board.id, { type: "board-visibility", isPublic });
    return Response.send(res, OK, { isPublic });
}

const router = Router();
// Before requireAuth, logged out visitors can view public boards
router.get("/public/:shortId", getPublicBoard);
router.use(requireAuth);

router.get("/", listBoards);
router.post("/", createBoard);
router.get("/:boardId", requireBoardAccess, getBoard);
router.post("/:boardId", requireBoardAccess, permissionLevel.Owner, saveBoard);
router.post("/:boardId/rename", requireBoardAccess, permissionLevel.Owner, renameBoard);
router.post("/:boardId/visibility", requireBoardAccess, permissionLevel.Owner, setBoardVisibility);
router.post("/:boardId/update", requireBoardAccess, updateBoard);
router.post("/:boardId/history", requireBoardAccess, appendBoardHistory);
router.delete("/:boardId", requireBoardAccess, permissionLevel.Owner, deleteBoard);
router.get("/:boardId/users", requireBoardAccess, listBoardUsers);
router.post("/:boardId/guests", requireBoardAccess, permissionLevel.Owner, createGuest);
router.delete("/:boardId/guests/:userId", requireBoardAccess, permissionLevel.Owner, removeGuest);
router.post("/:boardId/guests/:userId/password", requireBoardAccess, setGuestPassword);
router.post(
    "/:boardId/guests/:userId/login-link",
    requireBoardAccess,
    permissionLevel.Owner,
    getGuestLink,
);
router.post(
    "/:boardId/guests/:userId/login-link/replace",
    requireBoardAccess,
    permissionLevel.Owner,
    replaceGuestLink,
);
router.post(
    "/:boardId/guests/:userId/sign-out",
    requireBoardAccess,
    permissionLevel.Owner,
    signOutGuest,
);
router.post(
    "/:boardId/tags/:tagId/accounts",
    requireBoardAccess,
    permissionLevel.Owner,
    assignAccountToTag,
);
router.delete(
    "/:boardId/tags/:tagId/accounts/:accountId",
    requireBoardAccess,
    permissionLevel.Owner,
    unassignAccountFromTag,
);

export default router;
