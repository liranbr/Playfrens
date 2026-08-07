// For the GetAppList -> `steam_apps` sync: `npm run sync:steam-applist`.
// Production scheduling should go through the Render Cron Job hitting "POST /api/steam/catalog/sync".
import "../env.js";
import { syncSteamAppList } from "../services/steamCatalogSync.js";

const summary = await syncSteamAppList({
    onPage: ({ page, count, totalUpserted }) =>
        console.log(`  page ${page}: +${count} (total ${totalUpserted})`),
});

console.log(
    `Done. ${summary.totalUpserted} apps across ${summary.pages} pages in ${Math.round(summary.tookMs / 1000)}s.`,
);
process.exit(0);

