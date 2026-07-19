import "../env.js";
import { Router } from "express";
import SGDB from "steamgriddb";
import { Response } from "../response.js";
import { strToBool } from "../utils.js";

const client = new SGDB(process.env.STEAMGRIDDB_API_KEY);

/** from a sgdbID, and optional animatedOnly and nsfw params, returns sgdb grids{url, thumb} */
async function getGrids(req, res) {
    const { sgdbID, nsfw = "false", animatedOnly = "false" } = req.query;
    const { NOT_FOUND, OK } = Response.HttpStatus;

    const gridOptions = {
        id: sgdbID,
        dimensions: ["600x900"],
        type: "game",
        types: strToBool(animatedOnly) ? ["animated"] : [],
        nsfw: nsfw,
    };
    let grids;
    try {
        grids = await client.getGrids(gridOptions);
    } catch {
        grids = [];
    }
    if (!grids.length)
        return Response.sendMessage(res, NOT_FOUND, `No grids were found for this game.`);
    const result = grids.map((grid) => ({ url: grid.url, thumb: grid.thumb }));

    Response.send(res, OK, result);
}

/** from a storeType and storeID, returns SGDBGame */
async function getGameFromStore(req, res) {
    const { storeType, storeID } = req.query;
    const { NOT_FOUND, OK } = Response.HttpStatus;

    const game = await client.getGame({ type: storeType, id: storeID });
    if (!game)
        return Response.send(
            res,
            NOT_FOUND,
            `No SGDB game was found for the ${storeType} game with ID ${storeID}`,
        );

    Response.send(res, OK, game);
}

/** given a title, this searches for it on sgdb, returns SGDBGame[] results */
async function searchTitle(req, res) {
    const { query } = req.query;
    const { NOT_FOUND, OK } = Response.HttpStatus;

    const games = await client.searchGame(query);
    if (games.length === 0)
        return Response.sendMessage(res, NOT_FOUND, `No games were found with the query: ${query}`);
    Response.send(res, OK, games);
}

const router = Router();
router.get("/getGrids", getGrids);
router.get("/getGameFromStore", getGameFromStore);
router.get("/searchTitle", searchTitle);

export default router;
