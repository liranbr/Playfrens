import { DialogBase } from "./DialogRoot.jsx";
import * as Dialog from "@radix-ui/react-dialog";
import "./SteamImportDialog.css";
import { Button, InfoIcon } from "@/components/index.js";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import * as Switch from "@radix-ui/react-switch";
import * as Checkbox from "@radix-ui/react-checkbox";
import { useState } from "react";
import { MdCheck } from "react-icons/md";

export const SteamImportDialog = ({ open, closeDialog }) => {
    const [alsoSingleplayers, setAlsoSingleplayers] = useState(false);
    console.log(alsoSingleplayers);
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

            <div className="steam-public-data-tip">
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
                <input type="checkbox" id="also-singleplayers-checkbox" />
                Include wishlisted games that haven't released yet
                <InfoIcon message="Wishlist may contain games that have not released yet, but you might want to plan to play them" />
            </label>

            <div className="rx-dialog-footer">
                <Button variant="primary" onClick={undefined}>
                    Import (NOT IMPLEMENTED YET)
                </Button>
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
};
