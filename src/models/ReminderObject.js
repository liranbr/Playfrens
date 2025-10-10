import { makeAutoObservable } from "mobx";
import { v4 as randomUUID } from "uuid";

export class ReminderObject {
    date;
    message;
    gameID;
    id; // UUID

    constructor({ date, message, gameID, id }) {
        if (!(date instanceof Date)) {
            date = new Date(date); // try turning it into one in case it's a JSON-ified Date value
            if (isNaN(date.valueOf())) throw new TypeError("date must be an instance of Date");
        }
        if (typeof message !== "string") throw new TypeError("message must be a string");
        if (typeof gameID !== "string" || gameID.length === 0) throw new Error("GameID is invalid");
        if (id && id.length === 0) throw new Error("UniqueID cannot be blank");

        this.date = date;
        this.message = message;
        this.gameID = gameID;
        this.id = id ?? randomUUID();
        makeAutoObservable(this);
    }

    getFormattedDate() {
        return this.date.toISOString().split("T")[0];
    }

    toString() {
        return `Reminder for date ${this.getFormattedDate()}, under game ${this.gameID}, reminder ID ${this.id}.\nmessage: ${this.message}`;
    }
}
