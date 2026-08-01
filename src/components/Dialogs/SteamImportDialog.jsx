import { Button, InfoIcon } from "@/components";
import { fetchSteamImportData, getLastSteamSync, processUsername } from "@/services/SteamImport.js";
import { useDataStore } from "@/stores/DataStore.js";
import { Dialogs, globalDialogStore } from "@/stores/DialogStore.js";
import { HttpStatus, toastError, toastInfo } from "@/Utils";
import * as Avatar from "@radix-ui/react-avatar";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useState } from "react";
import { MdPerson } from "react-icons/md";
import { DialogBase } from "./DialogRoot.jsx";
import "./SteamImportDialog.css";

export const SteamImportDialog = ({ open, closeDialog }) => {
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [instructionsVisible, setInstructionsVisible] = useState(false);
    const [lastSync] = useState(() => getLastSteamSync());
    const dataStore = useDataStore();
    const { NO_CONTENT, UNAUTHORIZED, NOT_FOUND } = HttpStatus;
    const [form, setForm] = useState({
        username: "",
        importLibrary: true,
        importWishlist: true,
        importFriendslist: true,
    });
    const [errors, setErrors] = useState({}); // used in validation

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

    // Pass overrideSteamID/overrideOptions to re-run a previous sync (see the "Sync Now" button)
    // instead of reading the manual entry form.
    const doImport = async (overrideSteamID, overrideOptions) => {
        if (loading) return;
        setLoading(true);

        const importOptions = overrideOptions ?? {
            importFriendslist: document.getElementById("friends-list").checked,
            importLibrary: document.getElementById("games-library").checked,
            importWishlist: document.getElementById("games-wishlist").checked,
            includeSingleplayer: document.getElementById("also-singleplayers-checkbox").checked,
            includeUnreleasedWishlist: document.getElementById("also-unreleased-wishlist-checkbox")
                .checked,
        };

        try {
            const steamID =
                overrideSteamID ??
                (await processUsername(document.getElementById("SteamIDInput").value));

            const {
                steamProfile: profileInfo,
                friendTags,
                games,
            } = await fetchSteamImportData(steamID, importOptions);

            if (friendTags.length === 0 && games.length === 0) {
                toastInfo("No data found to import.");
                setLoading(false);
                setSyncing(false);
                return;
            }

            const friendsResult = importOptions.importFriendslist
                ? dataStore.preImportFriends(friendTags)
                : {};
            const gamesResult =
                importOptions.importLibrary || importOptions.importWishlist
                    ? dataStore.preImportSteamGames(games)
                    : {};

            globalDialogStore.open(Dialogs.SteamImportConfirm, {
                gamesResult,
                friendsResult,
                steamProfile: {
                    name: profileInfo?.name || steamID,
                    iconURL: profileInfo?.iconURL || "",
                    profileURL: profileInfo?.profileURL || "",
                    steamID,
                },
                syncOptions: importOptions,
            });
        } catch (err) {
            console.error(err);
            toastError("Something went wrong while importing from Steam.");
        }

        setLoading(false);
        setSyncing(false);
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

            {lastSync && (
                <>
                    <div className="steam-last-sync">
                        <Avatar.Root className="rx-avatar">
                            <Avatar.Image
                                src={lastSync.iconURL || undefined}
                                referrerPolicy="no-referrer"
                            />
                            <Avatar.Fallback className="rx-avatarless" asChild>
                                <MdPerson />
                            </Avatar.Fallback>
                        </Avatar.Root>
                        <div className="steam-last-sync-details">
                            <a
                                href={lastSync.profileURL || undefined}
                                target="_blank"
                                rel="noreferrer"
                            >
                                {lastSync.name}
                            </a>
                            <small>
                                Last synced: {new Date(lastSync.syncedAt).toLocaleString()}
                            </small>
                        </div>
                        <Button
                            variant="secondary"
                            onClick={
                                !loading
                                    ? () => {
                                          setSyncing(true);
                                          return doImport(lastSync.steamID, lastSync.options);
                                      }
                                    : undefined
                            }
                        >
                            {loading && syncing ? "Syncing..." : "Sync Now"}
                        </Button>
                    </div>
                    <div className="separator" />
                    <div className="steam-last-sync-divider">Or import a different profile</div>
                </>
            )}

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
