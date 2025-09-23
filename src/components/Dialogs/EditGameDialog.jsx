import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialogs, globalDialogStore, useDataStore } from "@/stores";
import { Button, ScrollView, Spinner, SearchSelect } from "@/components";
import { DialogBase } from "./DialogRoot.jsx";
import { createContext, useContext, useEffect, useState } from "react";
import "./GamePageDialog.css";
import "./EditGameDialog.css";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { storeTypes } from "@/models/index.js";
import { searchTitleOnStore } from "@/APIUtils.js";

const GameEntryContext = createContext(null);

export function EditGameDialog({ open, closeDialog, game = null }) {
    const dataStore = useDataStore();
    const [title, setTitle] = useState(game?.title ?? "");
    const [coverImageURL, setCoverImageURL] = useState(game?.coverImageURL ?? "");
    const [sortingTitle, setSortingTitle] = useState(game?.sortingTitle ?? "");
    const [storeType, setStoreType] = useState(game?.storeType ?? "steam");
    const [storeID, setStoreID] = useState(game?.storeID ?? "");
    const [sgdbID, setSgdbID] = useState(game?.sgdbID ?? "");
    const [sgdbTitle, setSgdbTitle] = useState("");

    const dialogTitle = game ? "Edit Game Details" : "Add Game";
    const dialogDescription = game ? `Editing ${game.title}` : "Adding a new game";
    const titlePlaceholder =
        storeType === "custom" ? "Enter title" : `Search for a ${storeTypes[storeType]} game`;

    const handleSave = () => {
        if (game) {
            const editedSuccess = dataStore.editGame(
                game,
                title,
                coverImageURL,
                sortingTitle,
                storeType,
                storeID,
                sgdbID,
            );
            if (editedSuccess) closeDialog();
        } else {
            const newGame = dataStore.addGame(
                title,
                coverImageURL,
                sortingTitle,
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
        setTitle(selectedOption.title);
        setStoreType(selectedOption.storeType);
        setStoreID(selectedOption.storeID);

        if (selectedOption.storeType === "custom") {
            setSgdbID(selectedOption.sgdbID);
            setSgdbTitle(selectedOption.sgdbTitle);
        }
    };

    const searchTitle = async (query, setResults) =>
        setResults(await searchTitleOnStore(query, storeType));

    return (
        <GameEntryContext
            value={{
                title,
                setTitle,
                coverImageURL,
                setCoverImageURL,
                sortingTitle,
                setSortingTitle,
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
                                    value={title}
                                    onValueChange={setTitle}
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
                                value={sortingTitle}
                                onChange={(e) => setSortingTitle(e.target.value)}
                                onKeyDown={saveOnEnter}
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
        coverImageURL,
        setCoverImageURL,
        storeType,
        storeID,
        sgdbID,
        setSgdbID,
        sgdbTitle,
        setSgdbTitle,
    } = useContext(GameEntryContext);
    const [loadingCovers, setLoadingCovers] = useState(false);

    const searchSgdbTitle = async (query, setResults) =>
        setResults(await searchTitleOnStore(query, "custom"));

    // activated on selecting a Store Game, or selecting an SGDB entry in the SearchSelect below
    const selectSgdbGame = (SgdbGame) => {
        setSgdbID(SgdbGame.id);
        setSgdbTitle(SgdbGame.name);
    };

    // When a Store game is selected, retrieve its sgdb entry and select it
    useEffect(() => {
        if (!(storeType && storeID)) return;
        setLoadingCovers(true); // starting the fetch process. next step is fetching the entry's covers.
        fetch(`/api/steamgriddb/getGameFromStore?storeType=${storeType}&storeID=${storeID}`)
            .then((res) => {
                if (!res.ok) throw new Error("Failed to fetch game");
                return res.json();
            })
            .then(selectSgdbGame)
            .catch((err) => console.error(err));
    }, [storeID]);

    return (
        <div className="cover-art-selector">
            <fieldset>
                <label>Cover Art Database Search</label>
                <SearchSelect
                    delay={250}
                    value={sgdbTitle}
                    onValueChange={setSgdbTitle}
                    placeholder="Enter a [Game Title], or search here directly"
                    onQuery={searchSgdbTitle}
                    onKeyDown={saveOnEnter}
                    onSelect={selectSgdbGame}
                />

                <label>Cover Art URL</label>
                <input
                    value={coverImageURL}
                    onChange={(e) => setCoverImageURL(e.target.value)}
                    onKeyDown={saveOnEnter}
                    placeholder="Choose a cover, or manually enter URL"
                />
            </fieldset>

            <ScrollView>
                <CoversGallery loadingCovers={loadingCovers} setLoadingCovers={setLoadingCovers} />
            </ScrollView>
        </div>
    );
}

function CoversGallery({ loadingCovers, setLoadingCovers }) {
    const currentCoverImage = () => {
        return { url: coverImageURL, preview: coverImageURL };
    };
    const [error, setError] = useState("");
    const {
        title,
        coverImageURL,
        setCoverImageURL,
        storeType,
        storeID,
        sgdbID,
        setSgdbID,
        sgdbTitle,
        setSgdbTitle,
    } = useContext(GameEntryContext);
    const [images, setImages] = useState(coverImageURL ? [currentCoverImage()] : []);

    useEffect(() => {
        if (!coverImageURL) return;
        const img = new Image();
        img.src = coverImageURL;
    }, [coverImageURL]); // preload to cache full version of the selected cover

    useEffect(() => {
        if ((!title && !sgdbTitle) || (!storeID && !sgdbID)) return;
        setLoadingCovers(true);
        setImages([]);
        fetch(`/api/steamgriddb/getGrids?sgdbID=${sgdbID}`)
            .then((res) => {
                if (!res.ok) {
                    if (res.status === 404) return []; // no results is fine
                    throw new Error(`Status ${res.status}, failed to fetch grids for id ${sgdbID}`);
                }
                return res.json();
            })
            .then((data) => {
                // If there is already a selected cover art, always make it first
                if (coverImageURL)
                    data = [
                        currentCoverImage(),
                        ...data.filter((img) => img.url !== coverImageURL),
                    ];
                setImages(data);
            })
            .catch((err) => {
                console.warn(err);
                setError(err);
            })
            .finally(() => setLoadingCovers(false));

        // TODO: Whatever gets grids from SGDB, also needs to get the official grid, and the current GameObject's grid
        // TODO: re-implement requesting official cover directly, with data[0].coverType === 'official'
        // if (
        //     storeType === "steam" &&
        //     data[0].url.includes("steamstatic.com") &&
        //     !coverImageURL
        // )
        //     setCoverImageURL(data[0].url);
    }, [sgdbID]);

    if (loadingCovers) return <Spinner />;
    if (!images.length) {
        if (error) return <div>{"" + error}</div>;
        if (sgdbID) return <div>Entry has no covers</div>;
        else return <div />; // no selected entry and no error, means no search has been done yet
    }

    return (
        <div className="covers-gallery">
            {images.slice(0, 32).map((img) => (
                <img
                    key={img.url}
                    src={img.preview}
                    alt={sgdbTitle + " cover"}
                    onClick={() => setCoverImageURL(img.url)}
                    className={img.url === coverImageURL ? "selected-cover" : ""}
                />
            ))}
        </div>
    );
}
