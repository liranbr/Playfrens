// CLI for `steam_apps.type`/`content_descriptors` classification: `npm run sync:steam-apptypes`.
// Should go through the Render Cron Job hitting POST "/api/steam/catalog/enrichTypes".
// Optional args: a row cap (e.g. `-- 500`), `--retry-unknown` to re-check AppType.UNKNOWN rows,
// or `--backfill-descriptors` to fill content_descriptors on rows classified before it existed.
// If neither `--retry-unknown` nor `--backfill-descriptors` is passed, prompts interactively.
import { createInterface } from "node:readline/promises";
import "../env.js";
import { ConsoleColors } from "../utils.js";
import { enrichAppTypes, countUnknownTypes } from "../services/steamCatalogSync.js";

const { Bright, Dim, FgCyan, FgYellow, FgGreen, Reset } = ConsoleColors;

const args = process.argv.slice(2);
const backfillDescriptors = args.includes("--backfill-descriptors");
let retryUnknown = args.includes("--retry-unknown");
const limitArg = args.find((arg) => !arg.startsWith("--"));

if (!retryUnknown && !backfillDescriptors) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(
        `Choose:\n${Bright}${FgCyan}1${Reset}) All unclassified apps.\n${Bright}${FgYellow}2${Reset}) Previously-unknown apps only.\nInput ${Dim}[1/2]${Reset}: `,
    );
    rl.close();
    retryUnknown = answer.trim().toLowerCase().startsWith("2");
}

console.log(
    `${FgYellow}${await countUnknownTypes()} rows currently marked unknown (-1) in steam_apps.${Reset}`,
);

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
    `${FgGreen}Done. ${summary.totalEnriched} apps classified (${summary.totalUnknown} unknown) across ${summary.batches} batches in ${Math.round(summary.tookMs / 1000)}s.${Reset}`,
);
process.exit(0);
