// Manual CLI runner for `steam_apps.type` classification: `npm run sync:steam-apptypes`.
// Production scheduling goes through the Render Cron Job hitting POST /api/steam/catalog/enrichTypes.
// Optional args: a row cap (e.g. `-- 500`) and/or `--retry-unknown` to re-check AppType.UNKNOWN
// rows instead of unclassified ones (e.g. `-- 500 --retry-unknown`).
import "../env.js";
import { enrichAppTypes, countUnknownTypes } from "../services/steamCatalogSync.js";

const args = process.argv.slice(2);
const retryUnknown = args.includes("--retry-unknown");
const limitArg = args.find((arg) => arg !== "--retry-unknown");

console.log(`${await countUnknownTypes()} rows currently marked unknown (-1) in steam_apps.`);

const summary = await enrichAppTypes({
    limit: limitArg ? Number(limitArg) : undefined,
    retryUnknown,
    onBatch: ({ batch, count, totalEnriched, unknownCount, totalUnknown }) =>
        console.log(
            `  batch ${batch}: +${count} (total ${totalEnriched}, unknown +${unknownCount}/${totalUnknown})`,
        ),
});

console.log(
    `Done. ${summary.totalEnriched} apps classified (${summary.totalUnknown} unknown) across ${summary.batches} batches in ${Math.round(summary.tookMs / 1000)}s.`,
);
process.exit(0);

