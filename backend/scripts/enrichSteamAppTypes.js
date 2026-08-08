// CLI for `steam_apps.type`/`content_descriptors` classification: `npm run sync:steam-apptypes`.
// Should go through the Render Cron Job hitting POST "/api/steam/catalog/enrichTypes".
// Optional args: a row cap (e.g. `-- 500`), `--retry-unknown` to re-check AppType.UNKNOWN rows,
// or `--backfill-descriptors` to fill content_descriptors on rows classified before it existed.
import "../env.js";
import { enrichAppTypes, countUnknownTypes } from "../services/steamCatalogSync.js";

const args = process.argv.slice(2);
const retryUnknown = args.includes("--retry-unknown");
const backfillDescriptors = args.includes("--backfill-descriptors");
const limitArg = args.find((arg) => !arg.startsWith("--"));

console.log(`${await countUnknownTypes()} rows currently marked unknown (-1) in steam_apps.`);

const summary = await enrichAppTypes({
    limit: limitArg ? Number(limitArg) : undefined,
    retryUnknown,
    backfillDescriptors,
    onBatch: ({ batch, count, totalEnriched, unknownCount, totalUnknown }) =>
        console.log(
            `  batch ${batch}: +${count} (total ${totalEnriched}, unknown +${unknownCount}/${totalUnknown})`,
        ),
});

console.log(
    `Done. ${summary.totalEnriched} apps classified (${summary.totalUnknown} unknown) across ${summary.batches} batches in ${Math.round(summary.tookMs / 1000)}s.`,
);
process.exit(0);

