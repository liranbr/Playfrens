import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Button from "react-bootstrap/Button";
import { addGame } from "../Store.jsx";

export function EditGameModal({ show, setShow, game = null, setShowCardModal = null }) {
    const dialogTitle = game ? "Edit Game Details" : "Add Game";
    const dialogDescription = game ? `Editing ${game.title}` : "Adding a new game";

    const handleHide = () => {
        setShow(false);
        if (setShowCardModal) {
            setShowCardModal(true);
        }
    };
    const handleSave = () => {
        const getVal = id => document.getElementById(id).value;
        const gameTitle = getVal("gameTitleInput");
        const gameCoverPath = getVal("gameCoverInput");
        const gameSortingTitle = getVal("gameSortingTitleInput");

        const success = game
            ? game.editGame(gameTitle, gameCoverPath, gameSortingTitle)
            : addGame(gameTitle, gameCoverPath, gameSortingTitle);
        if (success) handleHide();
    };
    const saveOnEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <Dialog.Root open={show} onOpenChange={handleHide}>
            <Dialog.Portal>
                <Dialog.Overlay className="rx-dialog-overlay" />
                <Dialog.Content className="rx-dialog">
                    <Dialog.Title>{dialogTitle}</Dialog.Title>
                    <VisuallyHidden><Dialog.Description>{dialogDescription}</Dialog.Description></VisuallyHidden>
                    <fieldset>
                        <label>Game Title</label>
                        <input id="gameTitleInput" onKeyDown={saveOnEnter}
                               defaultValue={game ? game.title : ""} autoFocus />

                        <label>Game Cover URL</label>
                        <input id="gameCoverInput" onKeyDown={saveOnEnter}
                               defaultValue={game ? game.coverImageURL : ""} />
                        <text>
                            <a href="https://www.steamgriddb.com/" target="_blank" rel="noopener noreferrer">
                                SteamGridDB</a> (ideally 600x900)
                        </text>

                        <text><label>Sorting Title</label> (optional)</text>
                        <input id="gameSortingTitleInput" onKeyDown={saveOnEnter}
                               defaultValue={game ? game.sortingTitle : ""} />
                    </fieldset>

                    <div className="rx-dialog-footer">
                        <Button variant="secondary" onClick={handleHide}>
                            Close
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