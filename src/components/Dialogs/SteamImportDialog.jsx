import { getSteamIDFromVanity } from "@/APIUtils.js";
import { Button, InfoIcon } from "@/components";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState } from "react";
import { DialogBase } from "./DialogRoot.jsx";
import "./SteamImportDialog.css";

export const SteamImportDialog = ({ open, closeDialog }) => {
    const [loading, setLoading] = useState(false);
    const processUsername = async () => {
        /** @type {string} */
        const id = document.getElementById("SteamIDInput").value;
        const regexNumbersOnly = /^\d+$/;
        if (regexNumbersOnly.test(id)) {
            // Not valid, id length mismatch
            if (id.length !== 17) return false;
            // Valid
            return id;
        }

        const res = await getSteamIDFromVanity(id);
        if (!res.ok) {
            throw Error("Error occured - " + res.status);
        }
        const json = await res.json();
        return json.id;
    };

    const doImport = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const id = await processUsername();
            const ids = [];
            let frens = [];

            if (document.getElementById("games-wishlist").checked) {
                const res = await fetch(`/api/steam/getWishlistIDs?id=${id}`);
                if (!res.ok) throw Error("Error occured during importing wishlist");
                const wishlistItems = await res.json();
                ids.push(...wishlistItems);
            }

            if (document.getElementById("games-library").checked) {
                const res = await fetch(`/api/steam/getUserLibraryIDs?id=${id}`);
                if (!res.ok) throw Error("Error occured during importing wishlist");
                const libraryIDs = await res.json();
                ids.push(...libraryIDs);
            }

            if (document.getElementById("friends-list").checked) {
                const res = await fetch(`/api/steam/getFriends?id=${id}`);
                if (!res.ok) throw Error("Error occured during importing wishlist");
                frens = await res.json();
            }

            if (ids.length === 0 && frens.length === 0) return;

            const releasedOnly = !document.getElementById(
                "also-unreleased-wishlist-checkbox"
            ).checked;

            const allow_singleplayer_games = document.getElementById(
                "also-singleplayers-checkbox"
            ).checked;

            const res2 = await fetch(`/api/steam/getItems`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ids,
                    categories: [1, ...(allow_singleplayer_games ? [2] : [])],
                    releasedOnly
                }),
            });

            const items = await res2.json();

            const categoryMap = {
                1: "Multiplayer",
                2: "Singleplayer"
            };

            const win = window.open("", "_blank");

            win.document.write(`
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

            // ===== FRIENDS SECTION (above items) =====
            if (frens.length > 0) {
                win.document.write(`<h2>Friends (${frens.length})</h2>`);
                win.document.write(`<div class="friends-container">`);

                for (const fren of frens) {
                    if (!fren.visible) continue;

                    const avatarUrl = fren.avatar?.medium || "";
                    const profileUrl = fren.url || "#";
                    const nickname = fren.nickname || "Unknown";

                    win.document.write(`
                    <a href="${profileUrl}" target="_blank" title="${nickname}">
                        <img src="${avatarUrl}" alt="${nickname}">
                    </a>
                `);
                }

                win.document.write(`</div>`);
            }

            // ===== ITEMS SECTION =====
            win.document.write(`<h1>Total items: ${items.length}</h1>`);

            for (const item of items) {
                const supportedIds = item.categories?.supported_player_categoryids || [];

                const supportedNames = supportedIds
                    .filter(id => categoryMap[id])
                    .map(id => categoryMap[id]);

                let imageUrl;
                if (item.assets?.asset_url_format && item.assets?.header) {
                    imageUrl = `https://cdn.cloudflare.steamstatic.com/${item.assets.asset_url_format.replace("${FILENAME}", item.assets.header)}`;
                } else {
                    imageUrl = `https://cdn.akamai.steamstatic.com/steam/apps/${item.appid}/header.jpg`;
                }

                const comingSoonLabel = item.is_coming_soon === true
                    ? `<p style="color:red;"><strong>Coming Soon</strong></p>`
                    : "";

                win.document.write(`
                <div class="item">
                    <h2>${item.name}</h2>
                    ${comingSoonLabel}
                    <img src="${imageUrl}" alt="${item.name}">
                    <p>Supported: ${supportedNames.join(" / ") || "None"}</p>
                </div>
            `);
            }

            win.document.write(`
            </body>
            </html>
        `);

            win.document.close();
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
                <ol>
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
            </div>

            <fieldset>
                <label>
                    Username / SteamID64 / Profile URL
                    <br />
                    <small>Examples: gabelogannewell, 76561197960287930</small>
                </label>
                <input id="SteamIDInput" autoFocus placeholder="Username" />
            </fieldset>

            <label className="checkbox-label">
                <input type="checkbox" id="games-library" defaultChecked />
                Games Library
            </label>
            <label className="checkbox-label">
                <input type="checkbox" id="games-wishlist" defaultChecked />
                Games Wishlist
            </label>
            <label className="checkbox-label">
                <input type="checkbox" id="friends-list" defaultChecked />
                Friends
            </label>

            <div className="spacer" />
            <label className="checkbox-label">
                <input type="checkbox" id="also-singleplayers-checkbox" />
                Include Singleplayer games
                <InfoIcon message="By default, only games that Steam marks as Multiplayer or Cooperative are imported" />
            </label>
            <label className="checkbox-label">
                <input type="checkbox" id="also-unreleased-wishlist-checkbox" />
                Include wishlisted games that haven&apos;t released yet
                <InfoIcon message="Wishlist may contain games that have not released yet, but you might want to plan to play them" />
            </label>

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={doImport}>
                    {loading ? "Loading..." : "Get Data"}
                </Button>
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
};
