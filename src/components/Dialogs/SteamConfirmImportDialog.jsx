import * as Dialog from "@radix-ui/react-dialog";
import * as Avatar from "@radix-ui/react-avatar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MdPerson } from "react-icons/md";
import { DialogBase } from "./DialogRoot";
import "./SteamConfirmImportDialog.css";
import { Button } from "../common/Button";
import { globalDialogStore, useDataStore } from "@/stores";
import { saveLastSteamSync } from "@/services/SteamImport.js";

const ChangesColumn = ({ data, title }) => {
    const { toAdd, toUpdate, toSkip } = data;
    const { old } = toUpdate;

    const appendItem = (name, indx, type = "add") => {
        return (
            <div className={`steam-confirm-import-item item-${type}`} key={`${name}-${indx}`}>
                {name}
            </div>
        );
    };

    const createList = (data, type, label) => {
        return (
            <>
                {data.length > 0 && (
                    <>
                        <label>
                            {label} {data.length} item{data.length > 1 ? "s" : ""}:
                        </label>
                        <div className="steam-confirm-import-list">
                            {data.map((d, i) => appendItem(d.title || d.name, i, type))}
                        </div>
                    </>
                )}
            </>
        );
    };

    const allSkipped = toSkip.length > 0 && toAdd.length == 0 && old.length == 0;

    return (
        <div className="steam-confirm-import-container">
            <div className="steam-confirm-import-header">
                <h2>{title}</h2>
            </div>
            <div className="steam-confirm-import-scrollable">
                {/* {allSkipped && (
                    <div className="dialog-callout info" style={{ marginTop: "16px" }}>
                        <p>No {title} to add or update.</p>
                    </div>
                )} */}
                {
                    <fieldset>
                        {createList(toAdd, "add", "Adding")}
                        {createList(old, "update", "Updating")}
                        {createList(toSkip, "skip", "Skipping")}
                    </fieldset>
                }
            </div>
        </div>
    );
};
const SteamProfileHeader = ({ steamProfile, gamesResult, friendsResult }) => {
    if (!steamProfile) return null;
    const { name, iconURL, profileURL } = steamProfile;

    let importGamesInfo = undefined;
    if (gamesResult) {
        const gameChanges = [];
        const { toAdd, toSkip } = gamesResult;
        const toUpdate = gamesResult.toUpdate.old;
        if (toAdd.length) gameChanges.push("add " + toAdd.length);
        if (toUpdate.length) gameChanges.push("update " + toUpdate.length);
        if (toSkip.length) gameChanges.push("skip " + toSkip.length);
        importGamesInfo = "Games: will " + gameChanges.join(", ");
    }

    let importFriendsInfo = undefined;
    if (friendsResult) {
        const friendsChanges = [];
        const { toAdd, toSkip } = friendsResult;
        const toUpdate = friendsResult.toUpdate.old;
        if (toAdd.length) friendsChanges.push("add " + toAdd.length);
        if (toUpdate.length) friendsChanges.push("update " + toUpdate.length);
        if (toSkip.length) friendsChanges.push("skip " + toSkip.length);
        importFriendsInfo = "Friends: will " + friendsChanges.join(", ");
    }

    return (
        <div className="steam-confirm-import-profile">
            <Avatar.Root className="rx-avatar">
                <Avatar.Image src={iconURL || undefined} referrerPolicy="no-referrer" />
                <Avatar.Fallback className="rx-avatarless" asChild>
                    <MdPerson />
                </Avatar.Fallback>
            </Avatar.Root>
            <div className="steam-confirm-import-info">
                <h3>
                    <a href={profileURL || undefined} target="_blank" rel="noreferrer">
                        {name}
                    </a>
                </h3>
                {importGamesInfo && <p>{importGamesInfo}</p>}
                {importFriendsInfo && <p>{importFriendsInfo}</p>}
            </div>
        </div>
    );
};

export const SteamConfirmImportDialog = ({
    open,
    closeDialog,
    gamesResult,
    friendsResult,
    steamProfile,
    syncOptions,
}) => {
    const dataStore = useDataStore();

    const importingGames = Object.keys(gamesResult).length > 0;
    const importingFriends = Object.keys(friendsResult).length > 0;

    const pushImport = () => {
        importingFriends && dataStore.importFriends(friendsResult);
        importingGames && dataStore.importSteamGames(gamesResult);
        if (steamProfile?.steamID)
            saveLastSteamSync({
                steamID: steamProfile.steamID,
                profile: steamProfile,
                options: syncOptions,
            });
        globalDialogStore.closeMultiple(2);
    };

    return (
        <DialogBase
            open={open}
            onOpenChange={closeDialog}
            contentProps={{
                className: "rx-dialog steam-confirm-import-dialog",
                onOpenAutoFocus: (e) => {
                    e.preventDefault();
                    e.target.focus();
                },
            }}
        >
            <Dialog.Title>Confirm Import</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>Confirm if these matches your results.</Dialog.Description>
            </VisuallyHidden>
            <SteamProfileHeader
                steamProfile={steamProfile}
                gamesResult={gamesResult}
                friendsResult={friendsResult}
            />
            <div className="steam-confirm-import-body">
                {importingGames && <ChangesColumn data={gamesResult} title="Games" />}
                {importingGames && importingFriends && <div className="separator-vertical" />}
                {importingFriends && <ChangesColumn data={friendsResult} title="Friends" />}
            </div>
            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={pushImport}>
                    Import
                </Button>
            </div>
        </DialogBase>
    );
};
