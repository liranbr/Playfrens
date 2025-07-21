import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Button from "react-bootstrap/Button";
import { addGame } from "../../Store.jsx";
import { Modals, modalStore } from "./ModalStore.jsx";

export function EditGameModal({ open, closeModal, game = null }) {
    const dialogTitle = game ? "Edit Game Details" : "Add Game";
    const dialogDescription = game
        ? `Editing ${game.title}`
        : "Adding a new game";

    const handleHide = () => {
        closeModal();
    };
    const handleSave = () => {
        const getVal = (id) => document.getElementById(id).value;
        const gameTitle = getVal("gameTitleInput");
        const gameCoverPath = getVal("gameCoverInput");
        const gameSortingTitle = getVal("gameSortingTitleInput");

        if (game) {
            const success = game.editGame(
                gameTitle,
                gameCoverPath,
                gameSortingTitle,
            );
            if (success) {
                handleHide();
            }
        } else {
            const newGame = addGame(gameTitle, gameCoverPath, gameSortingTitle);
            if (newGame) {
                modalStore.insertPrevious(Modals.Playfrens, { game: newGame });
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
        <Dialog.Root open={open} onOpenChange={handleHide}>
            <Dialog.Portal>
                <Dialog.Overlay className="rx-dialog-overlay" />
                <Dialog.Content className="rx-dialog">
                    <Dialog.Title>{dialogTitle}</Dialog.Title>
                    <VisuallyHidden>
                        <Dialog.Description>
                            {dialogDescription}
                        </Dialog.Description>
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
                            </a>{" "}
                            (ideally 600x900)
                        </small>

                        <p>
                            <label>Sorting Title</label>
                            <small> (optional)</small>
                        </p>
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
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
