import { getSteamIDFromVanity, getSteamUserSummary } from "@/APIUtils.js";
import { storeTypes } from "@/models";
import { FriendTagObject } from "@/models/TagObject.js";
import { loadFromStorage } from "@/Utils";
import { HttpStatus } from "#shared/http.js";
import { ContentDescriptor } from "../../backend/services/steamCatalogSync";

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

const UNAVAILABLE_LIST_STATUSES = [
    HttpStatus.NO_CONTENT,
    HttpStatus.UNAUTHORIZED,
    HttpStatus.NOT_FOUND,
];

// Returns the list's JSON, or null after recording why it couldn't be fetched in `errors[key]`.
async function fetchImportList(url, key, title, errors) {
    const res = await fetch(url);
    if (UNAVAILABLE_LIST_STATUSES.includes(res.status))
        errors[key] = `Can't access ${title}, or it is empty.`;
    else if (!res.ok) errors[key] = `Error occurred while importing ${title}`;
    else return res.json();
    return null;
}

/**
 * Fetches a Steam profile's summary and (optionally) library/wishlist/friends data.
 * Does not touch DataStore or dialogs, so it can be
 * reused by both the import dialog and a "Sync Now" action.
 * `errors` is keyed by the failed option (e.g. importWishlist); when non-empty, nothing else is fetched.
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
    const errors = {};

    if (importLibrary) {
        const ids = await fetchImportList(
            `/api/steam/getUserLibraryIDs?id=${steamID}`,
            "importLibrary",
            "Games library",
            errors,
        );
        if (ids) groupedIDs["game_library"] = ids;
    }

    if (importWishlist) {
        const ids = await fetchImportList(
            `/api/steam/getWishlistIDs?id=${steamID}`,
            "importWishlist",
            "Wishlist",
            errors,
        );
        if (ids) groupedIDs["wishlist"] = ids;
    }

    if (importFriendslist) {
        frens =
            (await fetchImportList(
                `/api/steam/getFriends?id=${steamID}`,
                "importFriendslist",
                "Friendslist",
                errors,
            )) ?? [];
    }

    if (Object.keys(errors).length > 0) return { steamProfile, friendTags: [], games: [], errors };

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

        // getItems doesn't tag results with which group they came from (see comment above),
        // so wishlist is figured out here instead, against the wishlist IDs already fetched.
        const wishlistIDs = new Set((groupedIDs.wishlist ?? []).map(String));

        games = items.map((item) => ({
            title: item.name,
            coverImageURL: buildSteamAssetURL(
                item,
                item.assets?.library_capsule_2x ?? item.assets?.library_capsule,
            ),
            coverThumbURL: buildSteamAssetURL(item, item.assets?.library_capsule),
            thumbUrl: buildSteamAssetURL(item, item.assets?.library_capsule),
            sortingTitle: "",
            storeType: storeTypes.steam,
            storeID: item.id,
            wishlisted: wishlistIDs.has(String(item.id)),
            singleplayer: !item.categories?.supported_player_categoryids?.includes(1),
            unreleased: item.is_coming_soon === true,
            isAdult:
                item.content_descriptorids?.includes(ContentDescriptor.ADULT_ONLY_SEXUAL_CONTENT) ??
                false,
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

    return { steamProfile, friendTags, games, errors };
}
