import { Router } from "express";
import { Response } from "../response.js";
import { supabase } from "../supabaseClient.js";
import { requireAuth } from "../auth/requireAuth.js";

/**
 * Replaces the entire Board entry with a new one.
 * Receives { data }
 */
async function saveBoard(req, res) {
    const { OK, BAD_REQUEST } = Response.HttpStatus;

    const { data } = req.body;
    if (!data) {
        return Response.send(res, BAD_REQUEST, { error: "Missing board data" });
    }

    const { error } = await supabase
        .from("boards")
        .update({ board: data, last_updated: new Date() })
        .eq("owner_id", req.user.id);

    if (error) throw error;

    return Response.send(res, OK, { message: "Board updated successfully" });
}

/**
 * Update a board JSONB key entry via RPC, this is exactly like the localStorage keys we are doing.
 * Receives: { path, value }
 */
async function updateBoard(req, res) {
    const { OK, BAD_REQUEST } = Response.HttpStatus;

    const { path, value } = req.body;
    if (!Array.isArray(path) || value === undefined) {
        return Response.send(res, BAD_REQUEST, {
            error: "Invalid partial update payload",
        });
    }

    const { error } = await supabase.rpc("update_board_path", {
        _owner_id: req.user.id,
        _path: path,
        _value: value,
    });

    if (error) throw error;
    return Response.send(res, OK, { message: "Board updated (partial)" });
}

/**
 * Fetch a board by ID.
 */
async function getBoard(req, res) {
    const { OK, INTERNAL_SERVER_ERROR, NO_CONTENT } = Response.HttpStatus;

    try {
        const { data: board, error } = await supabase
            .from("boards")
            .select("*")
            .eq("owner_id", req.user.id)
            .single();

        if (error) {
            // If Supabase returns "no rows", handle gracefully
            if (error.code === "PGRST116") {
                return Response.send(res, NO_CONTENT, { message: "No board found for user" });
            }
            throw error;
        }

        Response.send(res, OK, { board });
    } catch (err) {
        console.error("Error fetching user board:", err);
        Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

const router = Router();
router.use(requireAuth);
router.post("/save", saveBoard);
router.post("/update", updateBoard);
router.get("/", getBoard);

export default router;

