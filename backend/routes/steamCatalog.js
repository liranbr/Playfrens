import "../env.js";
import { Router } from "express";
import { Response } from "../response.js";
import { supabase } from "../supabaseClient.js";
import { syncSteamAppList, enrichAppTypes } from "../services/steamCatalogSync.js";

// steam_apps.type is an AppType value (see services/steamCatalogSync.js); null means
// enrichTypes hasn't classified that row yet.

/**
 * Triggers a full IStoreService/GetAppList sync into `steam_apps`.
 * Requires a secret to be implemented.
 */
async function syncAppList(req, res) {
    const { OK, UNAUTHORIZED, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const providedSecret = req.get("x-sync-secret");

    if (!process.env.INTERNAL_SYNC_SECRET || providedSecret !== process.env.INTERNAL_SYNC_SECRET) {
        return Response.sendMessage(res, UNAUTHORIZED, "Missing or invalid sync secret.");
    }

    try {
        const summary = await syncSteamAppList();
        console.log("Sync complete:", summary);
        Response.send(res, OK, summary);
    } catch (err) {
        console.error("Sync failed:", err);
        Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

/**
 * Fills `steam_apps.type` for unclassified rows.
 * Requires a secret to be implemented.
 *  Optional body: `{ limit }` caps rows per call, `{ retryUnknown: true }` re-checks AppType.UNKNOWN rows.
 */
async function enrichTypes(req, res) {
    const { OK, UNAUTHORIZED, INTERNAL_SERVER_ERROR } = Response.HttpStatus;
    const providedSecret = req.get("x-sync-secret");

    if (!process.env.INTERNAL_SYNC_SECRET || providedSecret !== process.env.INTERNAL_SYNC_SECRET) {
        return Response.sendMessage(res, UNAUTHORIZED, "Missing or invalid sync secret.");
    }

    try {
        const limit = req.body?.limit ? Number(req.body.limit) : undefined;
        const summary = await enrichAppTypes({
            limit,
            retryUnknown: req.body?.retryUnknown === true,
        });
        console.log("Type enrichment complete:", summary);
        Response.send(res, OK, summary);
    } catch (err) {
        console.error("Type enrichment failed:", err);
        Response.send(res, INTERNAL_SERVER_ERROR, { error: err.message });
    }
}

/** Fuzzy-searches the cached catalog by name. `excludeDlc=true` drops classified DLC rows. */
async function searchCatalog(req, res) {
    const { term, excludeDlc } = req.query;
    const { OK, BAD_REQUEST, NOT_FOUND } = Response.HttpStatus;

    if (!term || term.trim().length < 2)
        return Response.sendMessage(
            res,
            BAD_REQUEST,
            "Query param 'term' must be at least 2 characters.",
        );

    const { data, error } = await supabase.rpc("search_steam_apps", {
        search_term: term.trim(),
        result_limit: 25,
        exclude_dlc: excludeDlc === "true",
    });
    if (error) throw error;
    if (!data.length)
        return Response.send(res, NOT_FOUND, `No cached Steam apps matched "${term}"`);
    return Response.send(res, OK, data);
}

const router = Router();
// router.use(requireAuth);
router.post("/sync", syncAppList);
router.post("/enrichTypes", enrichTypes);
router.get("/search", searchCatalog);

export default router;

