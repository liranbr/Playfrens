import { Service } from "./service.js";

export class SteamGridDBService extends Service {
    constructor() {
        this.environment_key = process.env.STEAMGRIDDB_API_KEY;
        console.log("ENVRIONEMENT KEY", this.environment_key);
    }
}
