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
     * Update a board JSONB data.
     * Frontend should send: { data }
     */
    async updateBoard(req, res) {
        const { OK, BAD_REQUEST, INTERNAL_SERVER_ERROR } = Response.HttpStatus;

        if (!req.isAuthenticated()) {
            return Response.send(res, BAD_REQUEST, { error: "Not logged in" });
        }

        const { data } = req.body;
        if (!data) {
            return Response.send(res, BAD_REQUEST, { error: "Missing board data" });
        }

        try {
            // Update board by owner_id
            const { error } = await supabase
                .from("boards")
                .update({ board: data, last_updated: new Date() })
                .eq("owner_id", req.user.id);

            if (error) throw error;

            Response.send(res, OK, { message: "Board updated successfully" });
        } catch (err) {
            console.error("Error updating board:", err);
            Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
        }
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
