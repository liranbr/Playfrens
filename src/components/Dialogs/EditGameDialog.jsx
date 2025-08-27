import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialogs, dialogStore, useDataStore } from "@/stores";
import { Button } from "@/components";
import { DialogBase } from "./DialogRoot.jsx";
import { useEffect, useRef, useState } from "react";
import "./GamePageDialog.css";
import "./EditGameDialog.css";

export function EditGameDialog({ open, closeDialog, game = null }) {
    const dataStore = useDataStore();
    const [gameName, setGameName] = useState("");
    const timer = useRef(null);

    const gameCoverInputRef = useRef(null);
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
            const edited = dataStore.editGame(game, gameTitle, gameCoverPath, gameSortingTitle);
            if (edited) {
                handleHide();
            }
        } else {
            const newGame = dataStore.addGame(gameTitle, gameCoverPath, gameSortingTitle);
            if (newGame) {
                dialogStore.insertPrevious(Dialogs.GamePage, { game: newGame });
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

    const handleInputChange = (e) => {
        const value = e.target.value;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            setGameName(value);
        }, 1000); // adjust debounce delay as needed
    };

    return (
        <DialogBase
            open={open}
            onOpenChange={handleHide}
            contentProps={{ forceMount: !game, className: "rx-dialog edit-game-dialog" }}
        >
            <div className="card-dialog cover-art-selector">
                <Dialog.Title>Cover Art</Dialog.Title>
                <fieldset>
                    <input
                        ref={gameCoverInputRef}
                        id="gameCoverInput"
                        onKeyDown={saveOnEnter}
                        defaultValue={game ? game.coverImageURL : ""}
                        placeholder="Enter URL, or choose from title-based suggestions"
                    />
                </fieldset>
                <SteamGridDBImages
                    key={gameName}
                    gameName={gameName}
                    gameCoverInputRef={gameCoverInputRef}
                />
            </div>

            <div className="card-dialog">
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
                        onChange={handleInputChange}
                    />

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
            </div>
        </DialogBase>
    );
}

function SteamGridDBImages({ gameName, gameCoverInputRef }) {
    const [images, setImages] = useState([]);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!gameName) return;
        fetch(`/api/steamgriddb/getGrids/${encodeURIComponent(gameName)}`)
            .then((res) => {
                if (!res.ok) throw new Error("No results");
                return res.json();
            })
            .then((data) => {
                setImages(data);
            })
            .catch((err) => setError(err.message), setImages([]));
    }, [gameName]);

    if (error) return <div>Error: {error}</div>;
    if (images.length == 0) return <></>;
    return (
        <div>
            or choose one of these images:
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    alignContent: "center",
                    justifyContent: "space-evenly",
                    flex: "0 0 33.333%",
                    flexWrap: "wrap",
                }}
            >
                {images.slice(0, 6).map((img) => (
                    <img
                        style={{ marginTop: 8 }}
                        key={img.url}
                        src={img.preview}
                        alt=""
                        width={100}
                        height={150}
                        onClick={() => {
                            gameCoverInputRef.current.value = img.url;
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
