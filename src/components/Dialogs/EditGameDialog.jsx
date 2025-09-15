import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialogs, globalDialogStore, useDataStore } from "@/stores";
import { Button, ScrollView, Spinner, SearchSelect } from "@/components";
import { DialogBase } from "./DialogRoot.jsx";
import { useEffect, useRef, useState } from "react";
import "./GamePageDialog.css";
import "./EditGameDialog.css";
import * as ToggleGroup from "@radix-ui/react-toggle-group";

export function EditGameDialog({ open, closeDialog, game = null }) {
    const dataStore = useDataStore();
    const [selectedGameEntry, setSelectedGameEntry] = useState(
        game
            ? {
                title: game.title,
                storeType: game.storeType,
                storeID: game.storeID,
            }
            : null, // TODO auto-search for covers if there is a selectedgameentry already.
    );
    const [isSteamGame, setIsSteamGame] = useState(game ? game.storeType === "steam" : true);
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
                globalDialogStore.insertPrevious(Dialogs.GamePage, { game: newGame });
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

    const handleSelectChange = (selectedOption) => {
        if (selectedOption.storeID === selectedGameEntry?.storeID) return;
        if (timer.current) clearTimeout(timer.current);
        const timerDelay = selectedOption ? 500 : 0; // if there's a title, wait for it to be typed,
        setLoadingCovers(!!selectedOption); // and show a spinner while typing and requesting
        timer.current = setTimeout(() => {
            setSelectedGameEntry(selectedOption);
        }, timerDelay);
    };

    const doFetch = async (query) => {
        return await (isSteamGame ? fetch(`/api/steamweb/getStorefront?term=${query}`) : fetch(`/api/steamgriddb/getGames?query=${query}`));
    }

    const onQuery = async (query, setResults) => {
        if (query === "") {
            setResults([]);
            return;
        }
        try {
            const res = await doFetch(query);
            if (!res.ok) throw new Error("No results");
            const json = await res.json();
            const results = (isSteamGame ? (json?.items) : json)?.map((item) => ({
                name: item.name, // built-in field for displaying text in the Select component
                title: item.name,
                // Empty string for none-steam games until further notice
                storeType: isSteamGame ? "steam" : "",
                storeID: item.id,
            }));
            setResults(results ?? []);
        } catch (err) {
            setResults([]);
        }
    };

    return (
        <DialogBase
            open={open}
            onOpenChange={handleHide}
            contentProps={{ forceMount: !game, className: "rx-dialog edit-game-dialog" }}
        >
            <Dialog.Title>{dialogTitle}</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>{dialogDescription}</Dialog.Description>
            </VisuallyHidden>
            <div className="edit-game-body">
                <div className="edit-game-fields">
                    <fieldset>
                        <div className="title-and-toggle">
                            <label>Game Title</label>
                            <ToggleGroup.Root
                                type="single"
                                className="rx-toggle-group"
                                value={isSteamGame ? "steam-game" : "non-steam-game"}
                                onValueChange={(value) => {
                                    setIsSteamGame(value === "steam-game");
                                }}
                            >
                                <ToggleGroup.Item value="steam-game">Steam Game</ToggleGroup.Item>
                                <ToggleGroup.Item value="non-steam-game">
                                    Non-Steam Game
                                </ToggleGroup.Item>
                            </ToggleGroup.Root>
                            <SearchSelect
                                delay={250}
                                // Remount when switching so we can clear setResults and query, relevant when adding new games.
                                key={"searchselect-" + isSteamGame}
                                id="gameTitleInput"
                                value={game ? game.title : ""}
                                autoFocus
                                placeholder="Enter game title to search for covers"
                                onQuery={onQuery}
                                onKeyDown={saveOnEnter}
                                onSelect={handleSelectChange}
                            />
                        </div>

                        <label>
                            Sorting Title<small> (optional)</small>
                        </label>
                        <input
                            id="gameSortingTitleInput"
                            onKeyDown={saveOnEnter}
                            defaultValue={game ? game.sortingTitle : ""}
                        />
                    </fieldset>
                </div>

                <div className="separator-vertical" />

                <div className="cover-art-selector">
                    <fieldset>
                        <label>Cover Art</label>
                        <input
                            ref={gameCoverInputRef}
                            id="gameCoverInput"
                            onKeyDown={saveOnEnter}
                            defaultValue={game ? game.coverImageURL : ""}
                            placeholder="Enter URL, or choose from the suggestions"
                        />
                    </fieldset>
                    <ScrollView>
                        {selectedGameEntry && (
                            <CoverSelector
                                key={selectedGameEntry.title}
                                gameEntry={selectedGameEntry}
                                gameCoverInputRef={gameCoverInputRef}
                                loadingCovers={loadingCovers}
                                setLoadingCovers={setLoadingCovers}
                            />
                        )}
                    </ScrollView>
                </div>
            </div>

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

function CoverSelector({ gameEntry, gameCoverInputRef, loadingCovers, setLoadingCovers }) {
    const [images, setImages] = useState([]);
    const [error, setError] = useState("");
    const [selectedURL, setSelectedURL] = useState("");

    useEffect(() => {
        if (!selectedURL) return;
        const img = new Image();
        img.src = selectedURL;
    }, [selectedURL]); // preload to cache full version of the selected cover

    useEffect(() => {
        if (!gameEntry.title) return;
        const fetchImages = async () => {
            try {
                const res = await fetch(
                    `/api/steamgriddb/getGrids?query=${encodeURIComponent(gameEntry.title)}${gameEntry.storeType === "steam" ? ("&steamID=" + gameEntry.storeID) : ("&sgdbID=" + gameEntry.storeID)}`,
                );
                setLoadingCovers(false);
                if (!res.ok) throw new Error("No results");
                const data = await res.json();
                if (data[0].url.includes("steamstatic.com") && !gameCoverInputRef.current.value)
                    onSelectedURL(data[0].url);
                setImages(data);
            } catch (err) {
                setLoadingCovers(false);
                setError(err.message);
                setImages([]);
            }
        };
        fetchImages();
    }, [gameEntry.title]);

    const onSelectedURL = (url) => {
        setSelectedURL(url);
        gameCoverInputRef.current.value = url;
    };

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
                    onClick={() => onSelectedURL(img.url)}
                    className={selectedURL === img.url ? "selected-cover" : ""}
                />
            ))}
        </div>
    );
}
