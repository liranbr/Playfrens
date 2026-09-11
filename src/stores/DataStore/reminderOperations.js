import { ReminderObject } from "@/models";
import { toastError, toastSuccess } from "@/Utils";

export function populateReminders(store, reminderJsons) {
    store.allReminders = [];
    if (typeof reminderJsons !== "object" || !Array.isArray(reminderJsons))
        return console.warn("Skipping invalid tagOrderJsons.");
    store.allReminders = reminderJsons
        .filter((reminder) => !!reminder.id)
        .map((reminder) => {
            if (!reminder.partyID) {
                // one-time conversion for reminders made before GameObjects had parties
                const reminderGame = store.allGames.get(reminder.gameID);
                reminder.partyID = reminderGame.parties[0].id;
            }
            return new ReminderObject({ ...reminder });
        });
}

/** @param {ReminderObject[]} reminders @returns {ReminderObject[]} */
export function getSortedReminders(reminders) {
    return reminders.toSorted((a, b) => a.date - b.date);
}

/** @param {ReminderObject} reminder */
export function addReminder(store, reminder) {
    if (!(reminder instanceof ReminderObject))
        return toastError("Invalid reminder object: " + reminder);
    if (store.allReminders.some((r) => r.id === reminder.id))
        return toastError("Reminder with this ID already exists");
    if (reminder.message.length === 0) return toastError("Reminder must have a message");

    store.allReminders.push(reminder);
    return toastSuccess("Reminder added");
}

export function removeReminder(store, reminder) {
    const index = store.allReminders.findIndex((r) => r.id === reminder.id);
    if (index === -1) return toastError("Error deleting reminder");
    store.allReminders.splice(index, 1);
    return toastSuccess("Reminder deleted");
}

export function editReminder(store, reminder, newDate, newMessage) {
    const index = store.allReminders.findIndex((r) => r.id === reminder.id);
    if (index === -1) return toastError("Error editing reminder");
    if (!(newDate instanceof Date)) return toastError("Invalid Date");
    if (typeof newMessage !== "string" || !newMessage.trim()) return toastError("Invalid Message");

    store.allReminders[index].date = newDate;
    store.allReminders[index].message = newMessage;
    return toastSuccess("Reminder edited");
}

