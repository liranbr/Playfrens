import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogBase } from "./DialogRoot";
import "./SteamConfirmImportDialog.css";

const ChangesColumn = ({ data }) => {

    const { toAdd, toUpdate, toSkip } = data;

    const appendItem = (name, indx, type = "add") => {
        return <div className={`steam-confirm-import-item import-item-${type}`} key={`${name}-${indx}`}>{name}</div>;
    }

    return (<div className="steam-confirm-import-fieldset">
        <fieldset>
            {toAdd.length > 0 &&
                <>
                    <label><i>Adding {toAdd.length} item{toAdd.length > 1 ? "s" : ""}:</i></label>
                    <div className="steam-confirm-import-list">
                        {toAdd.map((d, i) => appendItem(d.title || d.name, i, "add"))}
                    </div>
                </>
            }
            {toUpdate.old.length > 0 &&
                <>
                    <label><i>Updating {toUpdate.old.length} item{toUpdate.old.length > 1 ? "s" : ""}:</i></label>
                    <div className="steam-confirm-import-list">
                        {toUpdate.old.map((d, i) => appendItem(d.title || d.name, i, "update"))}
                    </div>
                </>
            }
            {toSkip.length > 0 &&
                <>
                    <label><i>Skipping {toSkip.length} item{toSkip.length > 1 ? "s" : ""}:</i></label>
                    <div className="steam-confirm-import-list">
                        {toSkip.map((d, i) => appendItem(d.title || d.name, i, "skip"))}
                    </div>
                </>
            }
        </fieldset>
    </div>)
}
export const SteamConfirmImportDialog = ({ open, closeDialog, gamesResult, friendsResult }) => {
    console.log(gamesResult, friendsResult);
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
                <ChangesColumn data={gamesResult} />
                <div className="separator-vertical" />
                <ChangesColumn data={friendsResult} />
            </div>
        </DialogBase>
    );
};
