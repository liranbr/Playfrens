import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogBase } from "./DialogRoot";
import "./SteamConfirmImportDialog.css";

const ChangesColumn = ({ data, title }) => {

    const { toAdd, toUpdate, toSkip } = data;
    const { old } = toUpdate;

    const appendItem = (name, indx, type = "add") => {
        return <div className={`steam-confirm-import-item item-${type}`} key={`${name}-${indx}`}>{name}</div>;
    }

    const createList = (data, type, label) => {
        return (<>
            {
                data.length > 0 && <>
                    <label><i>{label} {data.length} item{data.length > 1 ? "s" : ""}:</i></label>
                    <div className="steam-confirm-import-list">
                        {data.map((d, i) => appendItem(d.title || d.name, i, type))}
                    </div>
                </>
            }
        </>
        )
    }

    return (<div className="steam-confirm-import-fieldset">
        <h2>{title}</h2>
        <fieldset>
            {createList(toAdd, "add", "Adding")}
            {createList(old, "update", "Updating")}
            {createList(toSkip, "skip", "Skipping")}
        </fieldset>
    </div>)
}
export const SteamConfirmImportDialog = ({ open, closeDialog, gamesResult, friendsResult }) => {
    console.log(gamesResult, friendsResult);
    const importingGames = Object.keys(gamesResult).length > 0;
    const importingFriends = Object.keys(friendsResult).length > 0;

    console.log(importingGames, importingFriends)

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
        </DialogBase>
    );
};
