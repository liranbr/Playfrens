import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialogs, dialogStore, useDataStore } from "@/stores";
import { Button, ScrollView, Spinner } from "@/components";
import { DialogBase } from "./DialogRoot.jsx";
import { useEffect, useRef, useState } from "react";
import "./GamePageDialog.css";
import "./EditGameDialog.css";

export function EditGameDialog({ open, closeDialog, game = null }) {
    const dataStore = useDataStore();
    const [gameName, setGameName] = useState("");
    const [loadingCovers, setLoadingCovers] = useState(false);
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

    const handleTitleChange = (e) => {
        const title = e.target.value;
        if (timer.current) clearTimeout(timer.current);
        const timerDelay = title ? 500 : 0; // if there's a title, wait for it to be typed,
        setLoadingCovers(!!title); // and show a spinner while typing and requesting
        timer.current = setTimeout(() => {
            setGameName(title);
        }, timerDelay);
    };

    return (
        <DialogBase
            open={open}
            onOpenChange={handleHide}
            contentProps={{ forceMount: !game, className: "rx-dialog edit-game-dialog" }}
        >
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
                        onChange={handleTitleChange}
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
                <ScrollView viewportClassName="covers-gallery-container">
                    <SteamGridDBImages
                        key={gameName}
                        gameName={gameName}
                        gameCoverInputRef={gameCoverInputRef}
                        loadingCovers={loadingCovers}
                        setLoadingCovers={setLoadingCovers}
                    />
                </ScrollView>
            </div>
        </DialogBase>
    );
}

function SteamGridDBImages({ gameName, gameCoverInputRef, loadingCovers, setLoadingCovers }) {
    const [images, setImages] = useState([]);
    const [error, setError] = useState("");
    const [selectedURL, setSelectedURL] = useState("");

    useEffect(() => {
        if (!gameName) return;
        fetch(`/api/steamgriddb/getGrids/${encodeURIComponent(gameName)}`)
            .then((res) => {
                setLoadingCovers(false);
                if (!res.ok) throw new Error("No results");
                return res.json();
            })
            .then((data) => {
                setLoadingCovers(false);
                setImages(data);
            })
            .catch((err) => {
                setLoadingCovers(false);
                setError(err.message);
                setImages([]);
            });
    }, [gameName]);

    if (loadingCovers) return <Spinner />;
    if (error) return <div>Error: {error}</div>;
    if (images.length === 0) return <div />;
    return (
        <div className="covers-gallery">
            {images.slice(0, 32).map((img) => (
                <img
                    key={img.url}
                    src={img.preview}
                    alt=""
                    onClick={() => {
                        setSelectedURL(img.url);
                        gameCoverInputRef.current.value = img.url;
                    }}
                    className={selectedURL === img.url ? "selected-cover" : ""}
                />
            ))}
        </div>
    );
}
