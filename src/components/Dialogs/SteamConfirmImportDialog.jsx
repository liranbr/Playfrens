import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { DialogBase } from "./DialogRoot";

export const SteamConfirmImportDialog = ({ open, closeDialog, gamesResult, friendsResult }) => {
    console.log(gamesResult, friendsResult);
    return (
        <DialogBase
            open={open}
            onOpenChange={closeDialog}
            contentProps={{
                className: "rx-dialog steam-import-dialog",
                onOpenAutoFocus: (e) => {
                    e.preventDefault();
                    e.target.focus();
                },
            }}
        >
            <Dialog.Title>Confirm Import</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>Is this good? idk you decide</Dialog.Description>
            </VisuallyHidden>
            <fieldset>
                <label>Games to Add/Skip</label>
                {gamesResult.toAdd.map((g) => (
                    <>
                        {g.title + ","}
                        <br />
                    </>
                ))}
                <>
                    ---
                    <br />
                </>
                {gamesResult.toSkip.map((g) => (
                    <>
                        {g.title + ","}
                        <br />
                    </>
                ))}
                <label>Frends to Add/Skip/Update</label>
                {friendsResult.toAdd.map((f) => (
                    <>
                        {f.name + ","}
                        <br />
                    </>
                ))}
                <>
                    ---
                    <br />
                </>
                {friendsResult.toSkip.map((f) => (
                    <>
                        {f.name + ","}
                        <br />
                    </>
                ))}
                <>
                    ---
                    <br />
                </>
                {friendsResult.toUpdate.old.map((f) => (
                    <>
                        {f.name + ","}
                        <br />
                    </>
                ))}
            </fieldset>
        </DialogBase>
    );
};
