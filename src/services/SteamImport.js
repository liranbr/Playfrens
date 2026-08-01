import { getSteamIDFromVanity, getSteamUserSummary } from "@/APIUtils.js";
import { FriendTagObject } from "@/models/TagObject.js";
import { loadFromStorage } from "@/Utils";

// Kept in localStorage only (not the Supabase-backed board) since this is a
// temporary, per-browser stand-in until "last imported Steam profile" gets a
// proper home on the account.
export const STEAM_SYNC_STORAGE_KEY = "steam-last-sync";

export function getLastSteamSync() {
    return loadFromStorage(STEAM_SYNC_STORAGE_KEY, null);
}

export function saveLastSteamSync({ steamID, profile, options }) {
    const record = {
        steamID,
        name: profile?.name || steamID,
        iconURL: profile?.iconURL || "",
        profileURL: profile?.profileURL || "",
        options,
        syncedAt: new Date().toISOString(),
    };
    localStorage.setItem(STEAM_SYNC_STORAGE_KEY, JSON.stringify(record));
    return record;
}

// Gets SteamID64, from a SteamID64 or Custom URL, with or without the full steam url
export async function processUsername(username) {
    if (typeof username !== "string") throw Error("Invalid username format");
    username = username.trim();
    if (username === "") throw Error("Username cannot be empty");

    // Checks for a clean SteamID64
    const IdIsNumbersOnly = /^\d+$/.test(username);
    if (IdIsNumbersOnly && username.length === 17) return username; // Valid SteamID64

    // Handles clean customURL, or full url + SteamID64/customURL
    const res = await getSteamIDFromVanity(username);
    if (!res.ok) throw Error(await res.text());

    const json = await res.json();
    return json.id;
}

function buildSteamAssetURL(item, filename) {
    if (!filename) return null;
    const base = item.assets?.asset_url_format
        ? `https://shared.steamstatic.com/store_item_assets/${item.assets.asset_url_format.replace("${FILENAME}", filename)}`
        : `https://cdn.akamai.steamstatic.com/steam/apps/${item.appid}/${filename}`;

    return base.split("?")[0];
}

/**
 * Fetches a Steam profile's summary and (optionally) library/wishlist/friends data.
 * Does not touch DataStore or dialogs, so it can be
 * reused by both the import dialog and a "Sync Now" action.
 */
export async function fetchSteamImportData(
    steamID,
    {
        importLibrary = false,
        importWishlist = false,
        importFriendslist = false,
        includeSingleplayer = false,
        includeUnreleasedWishlist = false,
    } = {},
) {
    let steamProfile = null;
    const summaryRes = await getSteamUserSummary(steamID);
    if (summaryRes.ok) {
        const summary = await summaryRes.json();
        steamProfile = {
            name: summary.nickname,
            iconURL: summary.avatar?.large || "",
            profileURL: summary.url || "",
        };
    }

    const groupedIDs = {};
    let frens = [];

    if (importLibrary) {
        const res = await fetch(`/api/steam/getUserLibraryIDs?id=${steamID}`);
        if (!res.ok) throw Error("Error occurred during importing game libraries");
        groupedIDs["game_library"] = await res.json();
    }

    if (importWishlist) {
        const res = await fetch(`/api/steam/getWishlistIDs?id=${steamID}`);
        if (!res.ok) throw Error("Error occurred during importing wishlist");
        if (res.status !== 204) groupedIDs["wishlist"] = await res.json();
    }

    if (importFriendslist) {
        const res = await fetch(`/api/steam/getFriends?id=${steamID}`);
        if (!res.ok) throw Error("Error occurred during importing friend list");
        frens = await res.json();
    }

    let games = [];
    if (Object.keys(groupedIDs).length > 0) {
        const res = await fetch(`/api/steam/getItems`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                // groupedIDs is an object containing keys referencing array of IDs, used to filter out between which is library games and wishlist in the request
                // When done, returns all items without context from which group they come from.
                groupedIDs,
                categories: [1, ...(includeSingleplayer ? [2] : [])],
                releasedOnly: !includeUnreleasedWishlist,
            }),
        });
        if (!res.ok) throw Error("Error occurred while fetching game details");
        const items = await res.json();

        games = items.map((item) => ({
            title: item.name,
            coverImageURL: buildSteamAssetURL(
                item,
                item.assets?.library_capsule_2x ?? item.assets?.library_capsule,
            ),
            coverThumbURL: buildSteamAssetURL(item, item.assets?.library_capsule),
            thumbUrl: buildSteamAssetURL(item, item.assets?.library_capsule),
            sortingTitle: "",
            storeType: "steam",
            storeID: item.id,
        }));
    }

    const friendTags = frens.map(
        (fren) =>
            new FriendTagObject({
                name: fren.nickname || "Unknown",
                iconURL: fren.avatar?.medium || "",
                steamID: fren.steamID,
            }),
    );

    return { steamProfile, friendTags, games };
}
