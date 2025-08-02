import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { addGame } from "../../stores/DataStore.jsx";
import { Dialogs, dialogStore } from "./DialogStore.jsx";
import { Button } from "../common/Button.jsx";
import { DialogBase } from "./DialogRoot.jsx";

export function EditGameDialog({ open, closeDialog, game = null }) {
    const dialogTitle = game ? "Edit Game Details" : "Add Game";
    const dialogDescription = game ? `Editing ${game.title}` : "Adding a new game";

    const handleHide = () => {
        closeDialog();
    };
    const handleSave = () => {
        const getVal = (id) => document.getElementById(id).value;
        const gameTitle = getVal("gameTitleInput");
        const gameCoverPath = getVal("gameCoverInput");
        const gameSortingTitle = getVal("gameSortingTitleInput");

        if (game) {
            const success = game.editGame(gameTitle, gameCoverPath, gameSortingTitle);
            if (success) {
                handleHide();
            }
        } else {
            const newGame = addGame(gameTitle, gameCoverPath, gameSortingTitle);
            if (newGame) {
                dialogStore.insertPrevious(Dialogs.Playfrens, { game: newGame });
                handleHide();
            }
        }
    };
    const saveOnEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <DialogBase open={open} onOpenChange={handleHide} >
            <Dialog.Title>{dialogTitle}</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>{dialogDescription}</Dialog.Description>
            </VisuallyHidden>
            <fieldset>
                <label>Game Title</label>
                <input
                    id="gameTitleInput"
                    onKeyDown={saveOnEnter}
                    defaultValue={game ? game.title : ""}
                    autoFocus
                />

                <label>Game Cover URL</label>
                <input
                    id="gameCoverInput"
                    onKeyDown={saveOnEnter}
                    defaultValue={game ? game.coverImageURL : ""}
                />
                <small>
                    <a
                        href="https://www.steamgriddb.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        SteamGridDB
                    </a>
                    {" (ideally 600x900)"}
                </small>

                <label>
                    Sorting Title<small> (optional)</small>
                </label>
                <input
                    id="gameSortingTitleInput"
                    onKeyDown={saveOnEnter}
                    defaultValue={game ? game.sortingTitle : ""}
                />
            </fieldset>

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={handleHide}>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleSave}>
                    Save
                </Button>
            </div>
        </DialogBase>
    );
}
