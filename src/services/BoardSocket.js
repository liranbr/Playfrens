import {
    globalBoardStore,
    globalDataStore,
    globalFilterStore,
    globalSettingsStore,
} from "@/stores";
import { toastError } from "@/Utils";

let socket = null;
let currentBoardId = null;
let reconnectAttempt = 0;
let reconnectTimer = null;
let intentionallyClosed = false;

function wsURL() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/ws`;
}

function handleMessage(event) {
    let message;
    try {
        message = JSON.parse(event.data);
    } catch {
        return; // frame is really bad, get out of here
    }

    switch (message.type) {
        case "board-update": {
            const [storageKey] = message.path;
            if (storageKey === "settings") {
                globalDataStore.withRemoteApplyGuard(() =>
                    globalSettingsStore.populate(message.value),
                );
            } else if (storageKey === "defaultFilters") {
                globalDataStore.withRemoteApplyGuard(() =>
                    globalFilterStore.populate(message.value),
                );
            } else {
                globalDataStore.applyRemoteUpdate(message.path, message.value, message.lastUpdated);
            }
            break;
        }
        case "board-replace":
            globalDataStore.notifyRemoteBoardReplaced(message.lastUpdated);
            break;
        case "board-deleted":
            globalDataStore.notifyBoardDeleted();
            break;
        case "members-changed":
            globalBoardStore.invalidateMembersCache(currentBoardId);
            break;
        case "removed-from-board":
            // Only act if we're still looking at that board. Ignore if already navigated away.
            if (message.boardId === currentBoardId) {
                toastError(message.reason || "You were removed from this board.");
                setTimeout(() => window.location.assign("/app"), 1500);
            }
            break;
        case "account-removed":
            toastError(message.reason || "This account was removed. :(");
            setTimeout(() => window.location.assign("/"), 3000);
            break;
        default:
            break;
    }
}

function scheduleReconnect() {
    if (intentionallyClosed) return;
    reconnectAttempt++;
    const delay = Math.min(1000 * 2 ** reconnectAttempt, 15000);
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectSocket, delay);
}

function connectSocket() {
    if (
        socket &&
        (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)
    ) {
        return;
    }
    intentionallyClosed = false;
    socket = new WebSocket(wsURL());

    socket.onopen = () => {
        reconnectAttempt = 0;
        if (currentBoardId)
            socket.send(JSON.stringify({ type: "subscribe", boardId: currentBoardId }));
    };
    socket.onmessage = handleMessage;
    socket.onclose = scheduleReconnect;
    socket.onerror = () => socket?.close();
}

/**
 * Subscribes to live updates for a board, connecting the socket first if needed. Call again
 * every time the active board changes, since a tab only ever has one active subscription.
 */
export function subscribeToBoard(boardId) {
    currentBoardId = boardId;
    if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "subscribe", boardId }));
    } else {
        connectSocket();
    }
}

export function closeBoardSocket() {
    intentionallyClosed = true;
    clearTimeout(reconnectTimer);
    socket?.close();
    socket = null;
    currentBoardId = null;
}
