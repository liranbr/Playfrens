import { DialogBase } from "./DialogRoot.jsx";
import * as Dialog from "@radix-ui/react-dialog";
import { updateTagBothGameCounters } from "@/stores";
import "./ChoosePartyToAddTagDialog.css";
import { tagTypeStrings } from "@/models";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export const ChoosePartyToAddTagDialog = ({ open, closeDialog, game, tag }) => {
    const title = "Add the " + tag.typeStrings.single + " to...";
    const handleAdd = (party) => {
        if (party.addTag(tag)) {
            updateTagBothGameCounters(tag);
            closeDialog();
        }
    };

    return (
        <DialogBase
            open={open}
            onOpenChange={closeDialog}
            contentProps={{
                onOpenAutoFocus: (e) => {
                    e.preventDefault(); // Focuses the dialog content instead of the first interactable element
                    e.target.focus();
                },
            }}
        >
            <Dialog.Title>{title}</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>
                    Choosing a Group from the game to add the Tag to
                </Dialog.Description>
            </VisuallyHidden>
            <div className="choose-party-list">
                {game.parties.map((party) => {
                    const disabled = party.hasTag(tag);
                    return (
                        <button
                            className="party-button"
                            disabled={disabled}
                            onClick={() => handleAdd(party)}
                            key={party.id}
                        >
                            {party.name}
                        </button>
                    );
                })}
            </div>
        </DialogBase>
    );
};
