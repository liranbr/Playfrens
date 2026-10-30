import http from "http";
import { WebSocketServer } from "ws";
import { supabase } from "../supabaseClient.js";

export const WS_PATH = "/ws";
const VERIFY_SOCKET_INTERVAL_MS = 30000;

// boardId -> Set<WebSocket>, and userId -> Set<WebSocket>
// This is all memory right now, we should look for alternatives (like redis).
const subscribersByBoard = new Map();
const socketsByUser = new Map();

function subscribe(boardId, ws) {
    if (!subscribersByBoard.has(boardId)) subscribersByBoard.set(boardId, new Set());
    subscribersByBoard.get(boardId).add(ws);
    ws.boardId = boardId;
}

function unsubscribe(ws) {
    if (!ws.boardId) return;
    subscribersByBoard.get(ws.boardId)?.delete(ws);
    ws.boardId = null;
}

function trackUserSocket(userId, ws) {
    if (!socketsByUser.has(userId)) socketsByUser.set(userId, new Set());
    socketsByUser.get(userId).add(ws);
}

function untrackUserSocket(userId, ws) {
    const sockets = socketsByUser.get(userId);
    if (!sockets) return;
    sockets.delete(ws);
    if (sockets.size === 0) socketsByUser.delete(userId);
}

/** Closes every live connection for a user, used when their whole account is deleted. */
export function closeUserSockets(userId, reason) {
    for (const ws of socketsByUser.get(userId) ?? []) {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({ type: "account-removed", reason }));
        }
        ws.close();
    }
}

// Broadcasts to every socket subscribed to a board including the sender
export function broadcastToBoard(boardId, message) {
    const subscribers = subscribersByBoard.get(boardId);
    if (!subscribers || subscribers.size === 0) return;
    const json = JSON.stringify(message);
    for (const ws of subscribers) {
        if (ws.readyState === ws.OPEN) ws.send(json);
    }
}

async function userHasBoardAccess(userId, boardId) {
    const { data: board, error } = await supabase
        .from("boards")
        .select("owner_id, members_id")
        .eq("id", boardId)
        .single();
    if (error || !board) return false;
    return board.owner_id === userId || (board.members_id ?? []).includes(userId);
}

// Attaches a WebSocket server to the HTTP server
export function attachBoardSocketServer(httpServer, { sessionMiddleware, passport }) {
    const wss = new WebSocketServer({ noServer: true });

    httpServer.on("upgrade", (req, socket, head) => {
        if (!req.url.startsWith(WS_PATH)) return; // not ours, ignore

        const res = new http.ServerResponse(req);
        res.assignSocket(socket);

        sessionMiddleware(req, res, () => {
            passport.initialize()(req, res, () => {
                passport.session()(req, res, () => {
                    res.detachSocket(socket);

                    if (!req.isAuthenticated?.()) {
                        socket.end("HTTP/1.1 401 Unauthorized\r\n\r\n");
                        return;
                    }

                    wss.handleUpgrade(req, socket, head, (ws) => {
                        wss.emit("connection", ws, req);
                    });
                });
            });
        });
    });

    // Drops sockets that stopped responding.
    const heartbeat = setInterval(() => {
        for (const ws of wss.clients) {
            if (!ws.isAlive) {
                ws.terminate();
                continue;
            }
            ws.isAlive = false;
            ws.ping();
        }
    }, VERIFY_SOCKET_INTERVAL_MS);
    wss.on("close", () => clearInterval(heartbeat));

    wss.on("connection", (ws, req) => {
        const userId = req.user.id;
        trackUserSocket(userId, ws);
        ws.isAlive = true;
        ws.on("pong", () => {
            ws.isAlive = true;
        });
        // Only accept the latest request for subscription
        let latestRequestedBoardId = null;

        ws.on("message", async (raw) => {
            let message;
            try {
                message = JSON.parse(raw.toString());
            } catch {
                return;
            }

            if (message.type === "subscribe" && message.boardId) {
                const requestedBoardId = message.boardId;
                latestRequestedBoardId = requestedBoardId;
                const allowed = await userHasBoardAccess(userId, requestedBoardId);
                if (latestRequestedBoardId !== requestedBoardId) return; // superseded, discard
                unsubscribe(ws); // a tab only ever has one active board at a time
                if (allowed) subscribe(requestedBoardId, ws);
            }
        });

        ws.on("close", () => {
            unsubscribe(ws);
            untrackUserSocket(userId, ws);
        });
        ws.on("error", () => {
            unsubscribe(ws);
            untrackUserSocket(userId, ws);
        });
    });

    return wss;
}
