import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { Response } from "../response.js";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../auth/requireAuth.js";
import { requireBoardAccess } from "../auth/requireBoardAccess.js";
import { deleteUserAccountRow, removeOrphanedBoardMembers, upsertUser } from "../auth/passport.js";
import {
    broadcastToBoard,
    closeUserSockets,
    forceDisconnectUserFromBoard,
} from "../ws/boardSocket.js";

// Lists boards the caller can access: their own plus any they've joined. `role` is for display
// only, since permissions are flat once you have access at all.
async function listBoards(req, res) {
    const { OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const userId = req.user.id;

    const { data: boards, error } = await supabase
        .from("boards")
        .select("id, name, short_id, owner_id, owner:owner_id(display_name)")
        .or(`owner_id.eq.${userId},members_id.cs.{${userId}}`);

    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });

    const list = boards.map((b) => ({
        id: b.id,
        shortId: b.short_id, // used to build the /app/<shortId> URL instead of the raw UUID
        role: b.owner_id === userId ? "owner" : "member",
        name:
            b.name ||
            (b.owner_id === userId ? "My Board" : `${b.owner?.display_name ?? "Unknown"}'s Board`),
    }));
    return Response.send(res, OK, { boards: list });
}

/** GET /:boardId (access is already resolved and the row already loaded by requireBoardAccess). */
async function getBoard(req, res) {
    const { OK } = Response.HttpStatus;
    return Response.send(res, OK, { board: req.board });
}

/** Replaces the entire board's data blob. Receives { data }. */
async function saveBoard(req, res) {
    const { OK, BAD_REQUEST } = Response.HttpStatus;
    const { data } = req.body;
    if (!data) return Response.send(res, BAD_REQUEST, { error: "Missing board data" });

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

/**
 * Updates a board JSONB key via RPC. `expectedLastUpdated`, when sent, rejects the write with 409
 * if the board changed since the client last saw it, instead of silently overwriting someone
 * else's change.
 */
async function updateBoard(req, res) {
    const { OK, BAD_REQUEST, CONFLICT } = Response.HttpStatus;
    const { path, value, expectedLastUpdated } = req.body;
    if (!Array.isArray(path) || value === undefined) {
        return Response.send(res, BAD_REQUEST, { error: "Invalid partial update payload" });
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

async function deleteBoard(req, res) {
    const { OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

    // Clean up member accounts made specifically for this board before it disappears.
    await removeOrphanedBoardMembers(req.board.id, "This board was deleted.");

    const { error } = await supabase.from("boards").delete().eq("id", req.board.id);
    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });

    broadcastToBoard(req.board.id, { type: "board-deleted" });
    return Response.send(res, OK, { message: "Board deleted" });
}

/** GET /:boardId/members (owner + every member's public profile fields). */
async function listMembers(req, res) {
    const { OK, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const memberIds = [req.board.owner_id, ...(req.board.members_id ?? [])];

    const { data: users, error } = await supabase
        .from("users")
        .select("id, display_name, avatar_url, member_username")
        .in("id", memberIds);
    if (error) return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });

    const members = users.map((u) => ({
        id: u.id,
        displayName: u.display_name,
        avatarURL: u.avatar_url,
        username: u.member_username, // set only for member-created accounts
        role: u.id === req.board.owner_id ? "owner" : "member",
    }));
    return Response.send(res, OK, { members });
}

/**
 * Creates a "board member" login for this board.
 */
async function createMember(req, res) {
    const { OK, BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    if (req.user.id !== req.board.owner_id) {
        return Response.send(res, FORBIDDEN, { error: "Only the board owner can add members." });
    }

    const { username, password } = req.body;
    if (!username || typeof username !== "string" || !username.trim()) {
        return Response.send(res, BAD_REQUEST, { error: "A username is required." });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
        return Response.send(res, BAD_REQUEST, {
            error: "Password must be at least 8 characters.",
        });
    }

    // Usernames only need to be unique to the board.
    const { data: existing } = await supabase
        .from("users")
        .select("id")
        .eq("member_username", username)
        .eq("home_board_id", req.board.id)
        .maybeSingle();
    if (existing) {
        return Response.send(res, BAD_REQUEST, {
            error: "That username is already taken on this board.",
        });
    }

    const localEmail = `${uuidv4()}@members.playfrens.local`;
    const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: localEmail,
        password,
        email_confirm: true,
    });
    if (createError) {
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: createError.message });
    }

    let user;
    try {
        user = await upsertUser(
            { id: created.user.id, email: localEmail, displayName: username },
            "email",
            { createHomeBoard: false },
        );
        const { error: updateError } = await supabase
            .from("users")
            .update({ member_username: username, home_board_id: req.board.id })
            .eq("id", user.id);
        if (updateError) throw updateError;
    } catch (err) {
        await supabase.auth.admin.deleteUser(created.user.id).catch(() => {});
        if (user?.id) await supabase.from("users").delete().eq("id", user.id);
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }

    const { error: memberError } = await supabase.rpc("add_board_member", {
        _board_id: req.board.id,
        _user_id: user.id,
    });
    if (memberError) {
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: memberError.message });
    }

    broadcastToBoard(req.board.id, { type: "members-changed" });
    return Response.send(res, OK, {
        member: { id: user.id, displayName: username, username },
        password, // shown once here for the inviter to copy/share out-of-band, never stored by us
    });
}

/**
 * Removes a member from this board
 */
async function removeMember(req, res) {
    const { OK, BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    if (req.user.id !== req.board.owner_id) {
        return Response.send(res, FORBIDDEN, { error: "Only the board owner can remove members." });
    }

    const { userId } = req.params;
    if (userId === req.board.owner_id) {
        return Response.send(res, BAD_REQUEST, { error: "The board's owner can't be removed." });
    }

    const { data: targetUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
    if (fetchError || !targetUser) {
        return Response.send(res, BAD_REQUEST, { error: "That member doesn't exist." });
    }

    const accountFullyDeleted = targetUser.home_board_id === req.board.id;
    try {
        if (accountFullyDeleted) {
            await deleteUserAccountRow(targetUser); // also strips them from every board's members_id
        } else {
            const { error } = await supabase.rpc("remove_board_member", {
                _board_id: req.board.id,
                _user_id: userId,
            });
            if (error) throw error;
        }
    } catch (err) {
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }

    // Kick their live connection immediately instead of waiting for their next request to fail.
    if (accountFullyDeleted) {
        closeUserSockets(userId, "This account was removed.");
    } else {
        forceDisconnectUserFromBoard(userId, req.board.id, "You were removed from this board.");
    }

    broadcastToBoard(req.board.id, { type: "members-changed" });
    return Response.send(res, OK, { message: "Member removed" });
}

const router = Router();
router.use(requireAuth);

router.get("/", listBoards);
router.get("/:boardId", requireBoardAccess, getBoard);
router.post("/:boardId", requireBoardAccess, saveBoard);
router.post("/:boardId/update", requireBoardAccess, updateBoard);
router.delete("/:boardId", requireBoardAccess, deleteBoard);
router.get("/:boardId/members", requireBoardAccess, listMembers);
router.post("/:boardId/members", requireBoardAccess, createMember);
router.delete("/:boardId/members/:userId", requireBoardAccess, removeMember);

export default router;

