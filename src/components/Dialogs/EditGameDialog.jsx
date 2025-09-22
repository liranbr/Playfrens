import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialogs, globalDialogStore, useDataStore } from "@/stores";
import { Button, ScrollView, Spinner, SearchSelect } from "@/components";
import { DialogBase } from "./DialogRoot.jsx";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import "./GamePageDialog.css";
import "./EditGameDialog.css";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { storeTypes } from "@/models/index.js";
import { searchTitleOnStore } from "@/APIUtils.js";

const GameEntryContext = createContext(null);

export function EditGameDialog({ open, closeDialog, game = null }) {
    const dataStore = useDataStore();
    const [title, setTitle] = useState(game?.title ?? "");
    const [storeType, setStoreType] = useState(game ? game.storeType || "custom" : "steam");
    const [storeID, setStoreID] = useState(game?.storeID ?? "");
    const [sgdbID, setSgdbID] = useState(game?.sgdbID ?? "");
    const [sgdbTitle, setSgdbTitle] = useState("");

    const dialogTitle = game ? "Edit Game Details" : "Add Game";
    const dialogDescription = game ? `Editing ${game.title}` : "Adding a new game";
    const titlePlaceholder =
        storeType === "custom" ? "Enter title" : `Search for a ${storeTypes[storeType]} game`;
    // todo: initialValue needed? maybe just Placeholder?

    const handleSave = () => {
        const getVal = (id) => document.getElementById(id).value;
        const gameTitle = getVal("gameTitleInput");
        const gameCoverPath = getVal("gameCoverInput");
        const gameSortingTitle = getVal("gameSortingTitleInput");

        if (game) {
            const edited = dataStore.editGame(
                game,
                gameTitle,
                gameCoverPath,
                gameSortingTitle,
                storeType,
                storeID,
                sgdbID,
            );
            if (edited) {
                closeDialog();
            }
        } else {
            const newGame = dataStore.addGame(
                gameTitle,
                gameCoverPath,
                gameSortingTitle,
                storeType,
                storeID,
                sgdbID,
            );
            if (newGame) {
                globalDialogStore.insertPrevious(Dialogs.GamePage, { game: newGame });
                closeDialog();
            }
        }
    };

    const saveOnEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    };

    const handleGameSelected = (selectedOption) => {
        setStoreType(selectedOption.storeType);
        setStoreID(selectedOption.storeID);
        setTitle(selectedOption.title);
        setSgdbID(selectedOption.sgdbID);
        setSgdbTitle(selectedOption.sgdbTitle);
    };

    const searchTitle = async (query, setResults) => {
        if (query === "") {
            setResults([]);
            return;
        }
        setResults(await searchTitleOnStore(query, storeType));
    };

    return (
        <GameEntryContext
            value={{
                title,
                setTitle,
                storeType,
                setStoreType,
                storeID,
                setStoreID,
                sgdbID,
                setSgdbID,
                sgdbTitle,
                setSgdbTitle,
            }}
        >
            <DialogBase
                open={open}
                onOpenChange={closeDialog}
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
                                    value={storeType}
                                    onValueChange={(value) => {
                                        if (value) setStoreType(value); // to avoid empty values
                                    }}
                                >
                                    {Object.entries(storeTypes).map(([key, value]) => (
                                        <ToggleGroup.Item
                                            key={key}
                                            value={key}
                                            disabled={key !== "steam" && key !== "custom"}
                                        >
                                            {value}
                                        </ToggleGroup.Item>
                                    ))}
                                </ToggleGroup.Root>
                                <SearchSelect
                                    delay={250}
                                    key={"searchselect-" + storeType} // Remount when switching so we can clear setResults and query, relevant when adding new games.
                                    id="gameTitleInput"
                                    initialValue={game ? game.title : ""}
                                    autoFocus
                                    placeholder={titlePlaceholder}
                                    onQuery={searchTitle}
                                    onKeyDown={saveOnEnter}
                                    onSelect={handleGameSelected}
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

                    <CoverSelector saveOnEnter={saveOnEnter} />
                </div>

                <div className="rx-dialog-footer">
                    <Button variant="secondary" onClick={closeDialog}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Save
                    </Button>
                </div>
            </DialogBase>
        </GameEntryContext>
    );
}

function CoverSelector({ saveOnEnter }) {
    const {
        title,
        setTitle,
        storeType,
        setStoreType,
        storeID,
        setStoreID,
        sgdbID,
        setSgdbID,
        sgdbTitle,
        setSgdbTitle,
    } = useContext(GameEntryContext);

    const [loadingCovers, setLoadingCovers] = useState(false);
    const gameCoverInputRef = useRef(null);

    const searchSgdbTitle = async (query, setResults) => {
        if (query === "") {
            setResults([]);
            return;
        }
        setResults(await searchTitleOnStore(query, "custom"));
    };

    useEffect(() => {
        if (!(storeType && storeID)) return;
        fetch(`/api/steamgriddb/getGameFromStore?storeType=${storeType}&storeID=${storeID}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch game");
                return res.json();
            })
            .then((json) => {
                setSgdbID(json.id);
                setSgdbTitle(json.name);
            })
            .catch((err) => console.error(err));
    }, [storeID]);

    const handleSgdbGameSelected = (selectedOption) => {
        setSgdbID(selectedOption.id);
        setSgdbTitle(selectedOption.name);
    };

    return (
        <div className="cover-art-selector">
            <fieldset>
                <label>Cover Art Database Search</label>
                <SearchSelect
                    delay={250}
                    id="sgdbTitleInput"
                    value={sgdbTitle}
                    onChange={setSgdbTitle}
                    initialValue={""} // TODO: fetch sgdb title
                    placeholder="Enter a [Game Title], or search here directly"
                    onQuery={searchSgdbTitle}
                    onKeyDown={saveOnEnter}
                    onSelect={handleSgdbGameSelected}
                />

                <label>Cover Art URL</label>
                <input
                    ref={gameCoverInputRef}
                    id="gameCoverInput"
                    onKeyDown={saveOnEnter}
                    // defaultValue={game ? game.coverImageURL : ""} TODO: restore after converting inputs to controlled
                    placeholder="Enter URL, or choose from the suggestions"
                />
            </fieldset>
            <ScrollView>
                <CoversGallery
                    key={"covers-gallery-" + sgdbID}
                    gameCoverInputRef={gameCoverInputRef}
                    loadingCovers={loadingCovers}
                    setLoadingCovers={setLoadingCovers}
                />
            </ScrollView>
        </div>
    );
}

function CoversGallery({ gameCoverInputRef, loadingCovers, setLoadingCovers }) {
    const [images, setImages] = useState([]);
    const [error, setError] = useState("");
    const [selectedURL, setSelectedURL] = useState("");
    const {
        title,
        setTitle,
        storeType,
        setStoreType,
        storeID,
        setStoreID,
        sgdbID,
        setSgdbID,
        sgdbTitle,
        setSgdbTitle,
    } = useContext(GameEntryContext);

    useEffect(() => {
        if (!selectedURL) return;
        const img = new Image();
        img.src = selectedURL;
    }, [selectedURL]); // preload to cache full version of the selected cover

    // TODO: Whatever gets grids from SGDB, also needs to get the official grid, and the current GameObject's grid
    // TODO: Convert this into a Promise with .then .catch etc, to move loadingCovers inwards
    useEffect(() => {
        if ((!title && !sgdbTitle) || (!storeType && !sgdbID)) return;
        const fetchImages = async () => {
            try {
                let sgdbData = { id: sgdbID, name: sgdbTitle }; // TODO: probably won't need this after switching to .then()
                if (!sgdbID && storeType && storeID) {
                    const res = await fetch(
                        `/api/steamgriddb/getGameFromStore?storeType=${storeType}&storeID=${storeID}`,
                    );
                    if (!res.ok) throw new Error("Couldn't find SGDB game from the Store game");
                    sgdbData = await res.json();
                    setSgdbID(sgdbData.id);
                    setSgdbTitle(sgdbData.name);
                }

                const res = await fetch(`/api/steamgriddb/getGrids?sgdbID=${sgdbData.id}`);
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
    }, [sgdbID]);

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
