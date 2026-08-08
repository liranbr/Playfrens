import "../env.js";
import { Response } from "../response.js";
import { supabase } from "../supabaseClient.js";
import { sleep } from "../utils.js";

const GET_APP_LIST_URL = "https://api.steampowered.com/IStoreService/GetAppList/v1/";
const GET_ITEMS_URL = "https://api.steampowered.com/IStoreBrowseService/GetItems/v1/";
const MAX_RESULTS_PER_PAGE = 50000; // Valve's documented ceiling.
const UPSERT_CHUNK_SIZE = 1000;
// GetItems takes ids via URL not a body, batches can fail eventually from size (250+)
// It failed on 200 size samples, so don't push it else, we get Error 400/414.
const ENRICH_BATCH_SIZE = 100;
// Delay so we don't get Error 429 from Steam.
const ENRICH_BATCH_DELAY_MS = 1000;
const MAX_RATE_LIMIT_RETRIES = 5;

// steam_apps.type values, from testing these are most likely what they mean.
export const AppType = Object.freeze({
    GAME: 0,
    DEMO: 1,
    DLC: 4,
    UNKNOWN: -1, // GetItems returned nothing for this appid.
});

// Unverified labels, see CONTENT_DESCRIPTOR.md for explanation.
export const ContentDescriptor = Object.freeze({
    SOME_NUDITY_OR_SEXUAL_CONTENT: 1, // has mild sexual content, e.g. BG3 and Skyrim, The Forest
    FREQUENT_VIOLENCE_OR_GORE: 2, // has violence or gore as its theme, e.g. Fallout, Doom games, The Forest, Corpse Party
    ADULT_ONLY_SEXUAL_CONTENT: 3, // the game's actual entire purpose is porn.
    FREQUENT_NUDITY_OR_SEXUAL_CONTENT: 4, // it seems to be always matched with descriptor 3.
    GENERAL_MATURE_CONTENT: 5, // pretty much on any game that is flagged 18+ regardless of nudity or not.
});

/** fetch() that retries on HTTP 429 with max retries. */
async function fetchWithRetry(url) {
    for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt++) {
        const response = await fetch(url);
        if (response.status !== Response.HttpStatus.TOO_MANY_REQUESTS) return response;

        const retryAfterSeconds = Number(response.headers.get("retry-after"));
        const waitMs = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 2 ** attempt * 1000;
        console.warn(
            `Rate-limited (attempt ${attempt + 1}/${MAX_RATE_LIMIT_RETRIES}), waiting ${waitMs}ms`,
        );
        await sleep(waitMs);
    }
    throw new Error("Request failed: HTTP 429 (rate limited after max retries)");
}

/**
 * Fetches one page of Steam's app catalog. Cursor pagination, not a webhook: feed `last_appid`
 * back in as the next call's `last_appid` until `have_more_results` is false.
 * @param {number|undefined} lastAppId
 * @param {number|undefined} ifModifiedSince - unix seconds; only return apps changed since then.
 */
async function fetchAppListPage(lastAppId, ifModifiedSince) {
    const params = new URLSearchParams({
        key: process.env.STEAM_WEB_API_KEY,
        include_games: "true",
        include_dlc: "true",
        include_software: "false",
        include_videos: "false",
        include_hardware: "false",
        max_results: String(MAX_RESULTS_PER_PAGE),
    });
    if (lastAppId !== undefined) params.set("last_appid", String(lastAppId));
    if (ifModifiedSince !== undefined) params.set("if_modified_since", String(ifModifiedSince));

    const response = await fetchWithRetry(`${GET_APP_LIST_URL}?${params.toString()}`);
    if (!response.ok) throw new Error(`GetAppList request failed: HTTP ${response.status}`);
    const json = await response.json();
    return json.response ?? { apps: [], have_more_results: false };
}

/**
 * Upserts a page into `steam_apps` via the `upsert_steam_apps` RPC, which skips rows where
 * nothing actually changed (see backend/sql/steam_apps.sql — avoids bloating the table).
 * @param {Array<{appid: number, name: string, last_modified?: number, price_change_number?: number}>} apps
 */
async function upsertApps(apps) {
    const rows = apps.map((app) => ({
        appid: app.appid,
        name: app.name,
        last_modified: app.last_modified ? new Date(app.last_modified * 1000).toISOString() : null,
        price_change_number: app.price_change_number ?? null,
    }));

    for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
        const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
        const { error } = await supabase.rpc("upsert_steam_apps", { apps: chunk });
        if (error) throw error;
    }
}

/**
 * Pages through Steam's whole catalog and mirrors it into `steam_apps`.
 * @param {{onPage?: (progress: {page: number, count: number, totalUpserted: number}) => void, sinceUnixSeconds?: number}} [options]
 * @returns {Promise<{pages: number, totalUpserted: number, tookMs: number}>}
 */
export async function syncSteamAppList({ onPage, sinceUnixSeconds } = {}) {
    const startedAt = Date.now();
    let lastAppId;
    let page = 0;
    let totalUpserted = 0;

    for (;;) {
        const {
            apps = [],
            have_more_results,
            last_appid,
        } = await fetchAppListPage(lastAppId, sinceUnixSeconds);
        page++;

        if (apps.length > 0) {
            await upsertApps(apps);
            totalUpserted += apps.length;
        }

        console.log(`Page ${page}: +${apps.length} apps (total ${totalUpserted})`);
        onPage?.({ page, count: apps.length, totalUpserted });

        if (!have_more_results) break;
        lastAppId = last_appid;
    }

    return { pages: page, totalUpserted, tookMs: Date.now() - startedAt };
}

/**
 * Fetches per-app data to classify `type` (see AppType above) and `content_descriptorids`
 * (Steam's own mature-content tags, e.g. `[1,2,5]` — descriptor 3 is what search filters on).
 * @param {number[]} appids
 */
async function fetchItemTypes(appids) {
    const json = {
        context: { language: "english", country_code: "US" },
        data_request: { include_assets: false },
    };
    json.ids = appids.map((appid) => ({ appid }));
    const params = new URLSearchParams({
        key: process.env.STEAM_WEB_API_KEY,
        input_json: JSON.stringify(json),
    });

    const response = await fetchWithRetry(`${GET_ITEMS_URL}?${params.toString()}`);
    if (!response.ok) throw new Error(`GetItems request failed: HTTP ${response.status}`);
    const data = await response.json();
    return data.response?.store_items ?? [];
}

/**
 * Returns the count of rows that are still marked AppType.UNKNOWN (-1)
 * @returns {Promise<number>}
 */
export async function countUnknownTypes() {
    const { count, error } = await supabase
        .from("steam_apps")
        .select("*", { count: "exact", head: true })
        .eq("type", AppType.UNKNOWN);
    if (error) throw error;
    return count ?? 0;
}

/**
 * Backfills `steam_apps.type` and `content_descriptors` for rows the app-list sync left
 * unclassified. Does not reclassify rows that already have a type, except null or
 * {@link AppType.UNKNOWN}.
 * @param {{limit?: number, onBatch?: (progress: {batch: number, count: number, totalEnriched: number, unknownCount: number, totalUnknown: number}) => void, retryUnknown?: boolean, backfillDescriptors?: boolean}} [options]
 *   `retryUnknown` rechecks only {@link AppType.UNKNOWN} rows.
 *   `backfillDescriptors` targets already-classified rows missing `content_descriptors`
 *   (added after `type` was — rows enriched before this won't have it yet).
 * @returns {Promise<{batches: number, totalEnriched: number, totalUnknown: number, tookMs: number}>}
 */
export async function enrichAppTypes({
    limit,
    onBatch,
    retryUnknown = false,
    backfillDescriptors = false,
} = {}) {
    const startedAt = Date.now();
    let batch = 0;
    let totalEnriched = 0;
    let totalUnknown = 0;
    let lastAppId = -1;

    for (;;) {
        const remaining = limit !== undefined ? limit - totalEnriched : ENRICH_BATCH_SIZE;
        if (remaining <= 0) break;
        const pageSize = Math.min(ENRICH_BATCH_SIZE, remaining);

        let query = supabase
            .from("steam_apps")
            .select("appid, name")
            .gt("appid", lastAppId)
            .order("appid", { ascending: true });
        if (retryUnknown) {
            query = query.eq("type", AppType.UNKNOWN);
        } else if (backfillDescriptors) {
            query = query
                .not("type", "is", null)
                .neq("type", AppType.UNKNOWN)
                .is("content_descriptors", null);
        } else {
            query = query.is("type", null);
        }
        const { data: rows, error: selectError } = await query.limit(pageSize);
        if (selectError) throw selectError;
        if (!rows.length) break;

        lastAppId = rows[rows.length - 1].appid;

        const items = await fetchItemTypes(rows.map((row) => row.appid));
        const typeByAppId = new Map(items.map((item) => [item.appid, item.type]));
        const descriptorsByAppId = new Map(
            items.map((item) => [item.appid, item.content_descriptorids ?? []]),
        );

        const updateRows = rows.map((row) => ({
            appid: row.appid,
            name: row.name,
            type: typeByAppId.get(row.appid) ?? AppType.UNKNOWN,
            content_descriptors: descriptorsByAppId.get(row.appid) ?? [],
        }));
        const { error: updateError } = await supabase
            .from("steam_apps")
            .upsert(updateRows, { onConflict: "appid" });
        if (updateError) throw updateError;

        const unknownCount = updateRows.filter((row) => row.type === AppType.UNKNOWN).length;

        batch++;
        totalEnriched += rows.length;
        totalUnknown += unknownCount;
        console.log(
            `Type-enrich batch ${batch}: +${rows.length} (total ${totalEnriched}, unknown +${unknownCount}/${totalUnknown})`,
        );
        onBatch?.({ batch, count: rows.length, totalEnriched, unknownCount, totalUnknown });

        await sleep(ENRICH_BATCH_DELAY_MS);
    }

    return { batches: batch, totalEnriched, totalUnknown, tookMs: Date.now() - startedAt };
}
