import { Dialogs, globalDialogStore } from "@/stores/DialogStore.js";

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MS = 1000;

let tail = Promise.resolve();
// stops the queue for good once true, since state can no longer be trusted to match
let hasFailedPermanently = false;

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithRetries(task) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            return await task();
        } catch (error) {
            console.warn(`Queued request failed (attempt ${attempt}/${MAX_ATTEMPTS})`, error);
            if (attempt === MAX_ATTEMPTS) throw error;
            await wait(RETRY_DELAY_MS * attempt);
        }
    }
}

/**
 * Runs `task` strictly after every previously queued task, so requests land in
 * order instead of whatever order a slow connection delivers them in.
 */
export function enqueueRequest(task) {
    const result = tail.then(() => {
        if (hasFailedPermanently) return;
        return runWithRetries(task).catch((error) => {
            hasFailedPermanently = true;
            globalDialogStore.open(Dialogs.SyncError);
            throw error;
        });
    });
    tail = result.catch(() => {}); // keep the chain alive regardless of this task's outcome
    return result;
}

