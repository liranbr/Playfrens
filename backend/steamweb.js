import SteamAPI from "../node_modules/steamapi/dist/index.js";
import { Service } from "./service.js";

export class SteamWebService extends Service {
    constructor(app) {
        super(app, process.env.STEAMWEB_API_KEY);
    }

    connect() {
        const client = new SteamAPI(this.environment_key);
        return client;
    }

    listen() {
        super.listen();
        this.app.get("/api/steamweb/getOwnedGames/:id", this.getOwnedGames.bind(this));
        this.app.get("/api/steamweb/getSteamCapsules/:id", this.getSteamCapsules.bind(this));
    }
    async getOwnedGames(req, res) {
        const { id } = req.params;
        const client = this.connect();
        if (!this.isIDDigitsOnly(id))
            return this.sendError(res, { message: `Invalid SteamID64 passed: ${id}` });
        try {
            const games = await client.getUserOwnedGames(id, { includeExtendedAppInfo: true });
            return this.sendOk(res, games);
        } catch (error) {
            return this.sendError(res, { message: error });
        }
    }

    // Capsules are the grids used to showcase games through the Steam Library
    /** Example code with 0 OPTIMIZATIONS!!!
     *
     *   fetch(`/api/steamweb/getSteamCapsules/76561198114085482`).then((res) => {
     *       if (!res.ok) throw new Error("No results");
     *       return res.json();
     *   }).then((json) => {
     *       json.map((d) => {
     *           addGame(d.name, d.image);
     *       })
     *   }).catch((err) => {
     *       console.log(err)
     *   })
     */
    async getSteamCapsules(req, res) {
        const { id } = req.params;
        const client = this.connect();
        if (!this.isIDDigitsOnly(id)) {
            console.log("ID BAD!!!", id);
            return this.sendError(res, { message: `Invalid SteamID64 passed: ${id}` });
        }
        try {
            const games = await client.getUserOwnedGames(id, { includeExtendedAppInfo: true });
            if (!games) return this.sendNotFound(res, "steam games", id);
            const grids = games.map((game) => {
                const { id, capsuleFilename, name } = game.game;
                const gridImage = (() => {
                    if (
                        capsuleFilename.includes("library_capsule.jpg") ||
                        capsuleFilename.includes("library_600x900.jpg")
                    )
                        return capsuleFilename.replace(".jpg", "_2x.jpg");
                    else return capsuleFilename;
                })();
                return {
                    name: name,
                    id: id,
                    image: `https://shared.steamstatic.com/store_item_assets/steam/apps/${id}/${gridImage}`,
                };
            });
            return this.sendOk(res, grids);
        } catch (error) {
            return this.sendError(res, { message: error });
        }
    }

    isIDDigitsOnly(id) {
        return /^\d+$/.test(id);
    }
}
