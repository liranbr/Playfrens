import { Response } from "../response.js";
import { supabase } from "../supabaseClient.js";

/**
 * Make sure this person can do such request on the board or even access it to begin with.
 */
export async function requireBoardAccess(req, res, next) {
    const { BAD_REQUEST, FORBIDDEN, INTERNAL_SERVER_ERROR, NOT_FOUND } = Response.HttpStatus;

    const { boardId } = req.params;
    if (!boardId) return Response.send(res, BAD_REQUEST, { error: "Missing board id" });

    const { data: board, error } = await supabase
        .from("boards")
        .select("*")
        .eq("id", boardId)
        .single();

    if (error) {
        if (error.code === "PGRST116")
            return Response.send(res, NOT_FOUND, { error: "Board not found" });

        console.error("Error loading board for access check:", error);
        return Response.send(res, INTERNAL_SERVER_ERROR, { error: error.message });
    }

    const isOwner = board.owner_id === req.user.id;
    const hasAccess = isOwner || (board.members_id ?? []).includes(req.user.id);
    if (!hasAccess)
        return Response.send(res, FORBIDDEN, { error: "You do not have access to this board" });

    req.board = board;
    req.isBoardOwner = isOwner;
    next();
}

/**
 * Verify the permission level required for this request, for now, only Owner level.
 * Don't use this middleware on routes anyone is allowed to use.
 */
export const permissionLevel = {
    Owner(req, res, next) {
        if (!req.isBoardOwner) {
            return Response.send(res, Response.HttpStatus.FORBIDDEN, {
                error: "Only the board owner can do this.",
            });
        }
        next();
    },
};
