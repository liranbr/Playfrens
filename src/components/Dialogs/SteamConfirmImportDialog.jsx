import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogBase } from "./DialogRoot";
import "./SteamConfirmImportDialog.css";
import { Button } from "../common/Button";
import { globalDialogStore, useDataStore } from "@/stores";

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
                {allSkipped && (
                    <div className="dialog-callout info" style={{ marginTop: "16px" }}>
                        <p>No {title} to add or update.</p>
                    </div>
                )}
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
export const SteamConfirmImportDialog = ({ open, closeDialog, gamesResult, friendsResult }) => {
    const dataStore = useDataStore();
    const pushImport = () => {
        /** Lazy catch error so in cases like {@link friendsResult} is null, does not crash and stops {@link gamesResult} from not importing */
        try {
            dataStore.importFriends(friendsResult);
        } catch {
            /* empty */
        }
        try {
            dataStore.importSteamGames(gamesResult);
        } catch {
            /* empty */
        }
        globalDialogStore.closeMultiple(2);
    };

    const importingGames = Object.keys(gamesResult).length > 0;
    const importingFriends = Object.keys(friendsResult).length > 0;
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
