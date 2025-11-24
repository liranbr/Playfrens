import { Service } from "../service.js";
import { Response } from "../response.js";
import { supabase } from "../server.js";

export class DatabaseService extends Service {
    constructor(app) {
        super(app);
    }

    listen() {
        super.listen();

        this.registerRoutes([
            {
                method: "post",
                path: "/api/board/save",
                handler: this.saveBoard.bind(this),
            },
            {
                method: "post",
                path: "/api/board/update",
                handler: this.updateBoard.bind(this),
            },
            {
                method: "get",
                path: "/api/board",
                handler: this.getBoard.bind(this),
            },
        ]);
    }

    /**
     * Replaces the entire Board entry with a new one.
     * Receives { data }
     */
    async saveBoard(req, res) {
        const { OK, UNAUTHORIZED, BAD_REQUEST } = Response.HttpStatus;

        if (!req.isAuthenticated()) {
            return Response.send(res, UNAUTHORIZED, { error: "Not logged in" });
        }

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
    async updateBoard(req, res) {
        const { OK, BAD_REQUEST } = Response.HttpStatus;

        if (!req.isAuthenticated()) {
            return Response.send(res, BAD_REQUEST, { error: "Not logged in" });
        }

        const { path, value } = req.body;
        console.log(path, value);
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
    async getBoard(req, res) {
        const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR, NO_CONTENT } = Response.HttpStatus;

        if (!req.isAuthenticated()) {
            return Response.send(res, BAD_REQUEST, { error: "Not logged in" });
        }

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
}
