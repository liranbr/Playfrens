import { getSteamIDFromVanity, getSteamUserSummary } from "@/APIUtils.js";
import { Button, InfoIcon } from "@/components";
import { FriendTagObject } from "@/models/TagObject.js";
import { useDataStore } from "@/stores/DataStore.js";
import { Dialogs, globalDialogStore } from "@/stores/DialogStore.js";
import { HttpStatus, toastError, toastInfo } from "@/Utils";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState } from "react";
import { DialogBase } from "./DialogRoot.jsx";
import "./SteamImportDialog.css";

export const SteamImportDialog = ({ open, closeDialog }) => {
    const [loading, setLoading] = useState(false);
    const [instructionsVisible, setInstructionsVisible] = useState(false);
    const dataStore = useDataStore();
    const { NO_CONTENT, UNAUTHORIZED, NOT_FOUND } = HttpStatus;
    const [form, setForm] = useState({
        username: "",
        importLibrary: true,
        importWishlist: true,
        importFriendslist: true,
    });
    const [errors, setErrors] = useState({}); // used in validation

    const DEBUG_OPEN_DATA_IN_NEW_TAB = false;
    // TODO LATER: Remove these temp debugging messages later
    // TODO LATER: Avoid fetching twice, for validation + import
    const validateInput = async () => {
        setErrors({});
        const nextErrors = {};
        if (!(form.importLibrary || form.importWishlist || form.importFriendslist)) {
            toastInfo("Choose some data to import");
            return false;
        }

        try {
            let steamID;
            try {
                steamID = await processUsername(form.username);
            } catch (e) {
                nextErrors["username"] = e.message;
            }

            if (steamID) {
                const testImport = async (dataString, dataTitle, apiQuery) => {
                    if (form[dataString]) {
                        const res = await fetch(`/api/steam/${apiQuery}?id=${steamID}`);
                        if ([NO_CONTENT, UNAUTHORIZED, NOT_FOUND].includes(res.status))
                            nextErrors[dataString] = `Can't access ${dataTitle}, or it is empty.`;
                        else if (!res.ok)
                            nextErrors[dataString] = `Error occurred while importing ${dataTitle}`;
                    }
                };

                const checks = [];
                checks.push(testImport("importLibrary", "Games library", "getUserLibraryIDs"));
                checks.push(testImport("importWishlist", "Wishlist", "getWishlistIDs"));
                checks.push(testImport("importFriendslist", "Friendslist", "getFriends"));
                await Promise.all(checks);
            }
            setErrors(nextErrors);
        } catch (e) {
            toastError(e.message);
        }

        if (Object.keys(nextErrors).length === 0) {
            await doImport();
            return true;
        }
        for (const err of Object.values(nextErrors)) {
            toastError(err);
        }
        return false;
    };

    const doImport = async () => {
        if (loading) return;
        setLoading(true);

        const importingFriends = document.getElementById("friends-list").checked;
        const importingLibrary = document.getElementById("games-library").checked;
        const importingWishlist = document.getElementById("games-wishlist").checked;

        let friendsResult = {},
            gamesResult = {};
        try {
            const username = document.getElementById("SteamIDInput").value;
            const id = await processUsername(username);
            const groupedIDs = {};
            let frens = [];

            let steamProfile = null;
            const summaryRes = await getSteamUserSummary(id);
            if (summaryRes.ok) {
                const summary = await summaryRes.json();
                steamProfile = {
                    name: summary.nickname,
                    iconURL: summary.avatar?.large || "",
                    profileURL: summary.url || "",
                };
            }

            if (importingLibrary) {
                const res = await fetch(`/api/steam/getUserLibraryIDs?id=${id}`);
                if (!res.ok) throw Error("Error occurred during importing game libraries");
                const libraryIDs = await res.json();
                groupedIDs["game_library"] = libraryIDs;
            }

            if (importingWishlist) {
                const res = await fetch(`/api/steam/getWishlistIDs?id=${id}`);
                if (!res.ok) throw Error("Error occurred during importing wishlist");
                if (res.status !== 204) {
                    const wishtlistIDs = await res.json();
                    groupedIDs["wishlist"] = wishtlistIDs;
                }
            }

            if (importingFriends) {
                const res = await fetch(`/api/steam/getFriends?id=${id}`);
                if (!res.ok) throw Error("Error occurred during importing friend list");
                frens = await res.json();
            }

            if (Object.keys(groupedIDs).length <= 0 && frens.length <= 0) return;

            const releasedOnly = !document.getElementById("also-unreleased-wishlist-checkbox")
                .checked;

            const allow_singleplayer_games = document.getElementById(
                "also-singleplayers-checkbox",
            ).checked;

            const res2 = await fetch(`/api/steam/getItems`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    // groupedIDs is an object containing keys referencing array of IDs, used to filter out between which is library games and wishlist in the request
                    // When done, returns all items without context from which group they come from.
                    groupedIDs,
                    categories: [1, ...(allow_singleplayer_games ? [2] : [])],
                    releasedOnly,
                }),
            });

            const items = await res2.json();
            const categoryMap = {
                1: "Multiplayer",
                2: "Singleplayer",
            };

            // For debugging, don't enable for production
            const win = DEBUG_OPEN_DATA_IN_NEW_TAB ? window.open("", "_blank") : null;

            win?.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                <title>Items Test</title>
                <style>
                body { font-family: Arial, sans-serif; }
                .friends-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-bottom: 20px;
                    align-items: center;
                }
                .friends-container img {
                    width: 64px;
                    height: 64px;
                    border-radius: 4px;
                }
                .item { margin-bottom: 30px; }
                .item img { width: 300px; display: block; }
                </style>
                </head>
                <body>
            `);

            if (frens.length > 0) {
                win?.document.write(`<h2>Friends (${frens.length})</h2>`);
                win?.document.write(`<div class="friends-container">`);

                const friendTags = [];

                for (const fren of frens) {
                    const avatarUrl = fren.avatar?.medium || "";
                    const profileUrl = fren.url || "#";
                    const nickname = fren.nickname || "Unknown";
                    const steamID = fren.steamID;
                    win?.document.write(`
                    <a href="${profileUrl}" target="_blank" title="${nickname}">
                        <img src="${avatarUrl}" alt="${nickname}">
                    </a>
                `);
                    friendTags.push(
                        new FriendTagObject({ name: nickname, iconURL: avatarUrl, steamID }),
                    );
                }

                friendsResult = dataStore.preImportFriends(friendTags);
                // dataStore.importFriends(friendsResult);

                win?.document.write(`</div>`);
            }

            win?.document.write(`<h1>Total items: ${items.length}</h1>`);
            const games = [];
            for (const item of items) {
                const game = {};

                const buildSteamAssetURL = (item, filename) => {
                    if (!filename) return null;
                    const base = item.assets?.asset_url_format
                        ? `https://shared.steamstatic.com/store_item_assets/${item.assets.asset_url_format.replace("${FILENAME}", filename)}`
                        : `https://cdn.akamai.steamstatic.com/steam/apps/${item.appid}/${filename}`;

                    return base.split("?")[0];
                };

                const imageUrl = buildSteamAssetURL(
                    item,
                    item.assets?.library_capsule_2x ?? item.assets?.library_capsule,
                );
                const thumbUrl = buildSteamAssetURL(item, item.assets?.library_capsule);

                game["title"] = item.name;
                game["coverImageURL"] = imageUrl;
                game["coverThumbURL"] = thumbUrl;
                game["thumbUrl"] = thumbUrl;
                game["sortingTitle"] = "";
                game["storeType"] = "steam";
                game["storeID"] = item.id;

                games.push(game);
                if (DEBUG_OPEN_DATA_IN_NEW_TAB) {
                    const supportedIds = item.categories?.supported_player_categoryids || [];

                    const supportedNames = supportedIds
                        .filter((id) => categoryMap[id])
                        .map((id) => categoryMap[id]);

                    const comingSoonLabel =
                        item.is_coming_soon === true
                            ? `<p style="color:red;"><strong>Coming Soon</strong></p>`
                            : "";

                    win?.document.write(`
                        <div class="item">
                        <h2>${item.name}</h2>
                        ${comingSoonLabel}
                        <img src="${imageUrl}" alt="${item.name}">
                        <p>Supported: ${supportedNames.join(" / ") || "None"}</p>
                        </div>
                        `);
                }
            }

            if (importingLibrary || importingWishlist)
                gamesResult = dataStore.preImportSteamGames(games);

            globalDialogStore.open(Dialogs.SteamImportConfirm, {
                gamesResult,
                friendsResult,
                steamProfile,
            });
            // closeDialog();

            // dataStore.importSteamGames(gamesResult);

            win?.document.write(`
            </body>
            </html>
        `);

            win?.document.close();
            setLoading(false);
            return null;
        } catch (err) {
            console.error(err);
        }

        setLoading(false);
    };

    return (
        <DialogBase
            open={open}
            onOpenChange={closeDialog}
            contentProps={{
                className: "rx-dialog steam-import-dialog",
                onOpenAutoFocus: (e) => {
                    e.preventDefault(); // Focuses the dialog content instead of the first interactable element
                    e.target.focus();
                },
            }}
        >
            <Dialog.Title>Import Steam Games & Friends</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>
                    Here you can import your games and friends from your Steam account.
                </Dialog.Description>
            </VisuallyHidden>

            <div className="dialog-callout">
                <b>The Steam profile and imported data must be public for this to work.</b>
                <ol
                    className={
                        "steam-privacy-instructions" + (instructionsVisible ? "" : " instr-hidden")
                    }
                >
                    <li>
                        From your Steam Profile, click the <b>Edit Profile</b> button
                    </li>
                    <li>
                        Open the <b>Privacy Settings</b>
                    </li>
                    <li>
                        Set <b>My Profile</b>, <b>Game details</b>, and <b>Friends List</b> to{" "}
                        <b>Public</b>
                    </li>
                </ol>
                <button
                    className="link-like expander"
                    onClick={() => {
                        setInstructionsVisible((curr) => !curr);
                    }}
                >
                    {instructionsVisible ? "minimize" : "how to"}
                </button>
            </div>

            <fieldset>
                <label>
                    Username / SteamID64 / Profile URL
                    <br />
                    <small>Examples: gabelogannewell, 76561197960287930</small>
                </label>
                <input
                    id="SteamIDInput"
                    autoFocus
                    placeholder="Username"
                    value={form.username}
                    onChange={(e) =>
                        setForm((curr) => ({
                            ...curr,
                            username: e.target.value,
                        }))
                    }
                    aria-invalid={!!errors.username}
                />
            </fieldset>

            <label className="checkbox-label">
                <input
                    type="checkbox"
                    id="games-library"
                    checked={form.importLibrary}
                    onChange={(e) =>
                        setForm((curr) => ({
                            ...curr,
                            importLibrary: e.target.checked,
                        }))
                    }
                    aria-invalid={!!errors.importLibrary}
                />
                Games Library
            </label>
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    id="games-wishlist"
                    checked={form.importWishlist}
                    onChange={(e) =>
                        setForm((curr) => ({
                            ...curr,
                            importWishlist: e.target.checked,
                        }))
                    }
                    aria-invalid={!!errors.importWishlist}
                />
                Games Wishlist
            </label>
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    id="friends-list"
                    checked={form.importFriendslist}
                    onChange={(e) =>
                        setForm((curr) => ({
                            ...curr,
                            importFriendslist: e.target.checked,
                        }))
                    }
                    aria-invalid={!!errors.importFriendslist}
                />
                Friends
            </label>

            <div className="spacer" />
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    id="also-singleplayers-checkbox"
                    disabled={!(form.importLibrary || form.importWishlist)}
                />
                Include Singleplayer games
                <InfoIcon message="By default, only games that Steam marks as Multiplayer or Cooperative are imported. If you only want to add a few singleplayers, consider adding them manually." />
            </label>
            <label className="checkbox-label">
                <input
                    type="checkbox"
                    id="also-unreleased-wishlist-checkbox"
                    disabled={!form.importWishlist}
                />
                Include wishlisted games that haven&apos;t released yet
                <InfoIcon message="Wishlist may contain games that have not released yet, but you might want to plan to play them" />
            </label>

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
                <Button variant="primary" onClick={!loading ? validateInput : undefined}>
                    {loading ? "Loading..." : "Preview Data"}
                </Button>
            </div>
        </DialogBase>
    );
};

// Gets SteamID64, from a SteamID64 or Custom URL, with or without the full steam url
const processUsername = async (username) => {
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
};
