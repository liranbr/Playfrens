import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Dialogs, globalDialogStore, useDataStore } from "@/stores";
import { Button, Spinner, SearchSelect, InfoIcon } from "@/components";
import { DialogBase } from "./DialogRoot.jsx";
import { createContext, useContext, useEffect, useState } from "react";
import "./GamePageDialog.css";
import "./EditGameDialog.css";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import * as Switch from "@radix-ui/react-switch";
import { storeTypes } from "@/models";
import { getOfficialCoverImageURL, searchTitleOnStore, sgdbDatedTitle } from "@/APIUtils.js";

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
    const [advancedView, setAdvancedView] = useState(false);

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
                advancedView,
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
                                    {Object.entries(storeTypes)
                                        .filter(([key, value]) => ["steam", "custom"].includes(key)) // other store types not supported yet
                                        .map(([key, value]) => (
                                            <ToggleGroup.Item key={key} value={key}>
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

                            {(advancedView || sortingTitle) && (
                                <>
                                    <label>
                                        Sorting Title
                                        <InfoIcon message="Optional. Helps sort franchises with irregular titles. e.g. 'Metroid Zero Mission = Metroid 1, Super Metroid = Metroid 3'" />
                                    </label>

                                    <input
                                        value={sortingTitle}
                                        onChange={(e) => setSortingTitle(e.target.value)}
                                        onKeyDown={saveOnEnter}
                                    />
                                </>
                            )}
                            {advancedView && storeType !== "custom" && (
                                <>
                                    <label style={{ color: "#777" }}>
                                        {storeTypes[storeType] + " Game ID"}
                                    </label>
                                    <input disabled value={storeID} />
                                </>
                            )}
                        </fieldset>
                    </div>

                    <div className="separator-vertical" />

                    <CoverSelector saveOnEnter={saveOnEnter} />
                </div>

                <div className="rx-dialog-footer">
                    <Button variant="secondary" onClick={() => setAdvancedView(!advancedView)}>
                        {advancedView ? "Simple" : "Advanced"}
                    </Button>
                    <div className="inner-footer">
                        <Button variant="secondary" onClick={closeDialog}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSave}>
                            Save
                        </Button>
                    </div>
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
        setSgdbID,
        sgdbTitle,
        setSgdbTitle,
        advancedView,
    } = useContext(GameEntryContext);
    const [loadingCovers, setLoadingCovers] = useState(false);
    const [animatedOnly, setAnimatedOnly] = useState(false);
    const [coversError, setCoversError] = useState("");

    const searchSgdbTitle = async (query, setResults) =>
        setResults(await searchTitleOnStore(query, "custom"));

    // activated on selecting a Store Game, or selecting an SGDB entry in the SearchSelect below
    const selectSgdbGame = (SgdbGame) => {
        setSgdbID(SgdbGame.id);
        setSgdbTitle(SgdbGame.sgdbTitle);
    };

    // When a Store game is selected, retrieve its sgdb entry and select it
    useEffect(() => {
        if (!(storeType && storeID)) return;
        setLoadingCovers(true); // starting the fetch process. next step is fetching the entry's covers.
        const params = new URLSearchParams({ storeType, storeID });
        fetch(`/api/steamgriddb/getGameFromStore?${params}`)
            .then((res) => {
                if (!res.ok)
                    throw new Error(
                        "Failed to fetch the covers database entry for the result. Maybe it isn't a regular game?",
                    );
                return res.json();
            })
            .then((sgdbEntry) => {
                sgdbEntry.sgdbTitle = sgdbDatedTitle(sgdbEntry);
                selectSgdbGame(sgdbEntry);
            })
            .catch((err) => {
                console.error(err);
                setCoversError(err);
            })
            .finally(() => setLoadingCovers(false));
    }, [storeID]);

    return (
        <div className="cover-art-selector">
            <fieldset>
                {!advancedView && <label>Select Cover Art</label>}
                {advancedView && (
                    <>
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

                        <div className="toggle-option">
                            <Switch.Root
                                className="rx-switch"
                                id="animated-covers-switch"
                                checked={animatedOnly}
                                onCheckedChange={setAnimatedOnly}
                            >
                                <Switch.Thumb />
                            </Switch.Root>{" "}
                            Only animated covers
                        </div>

                        <label>Cover Art URL</label>
                        <input
                            value={coverImageURL}
                            onChange={(e) => setCoverImageURL(e.target.value)}
                            onKeyDown={saveOnEnter}
                            placeholder="Choose a cover, or manually enter URL"
                        />
                    </>
                )}
            </fieldset>

            <CoversGallery
                loadingCovers={loadingCovers}
                setLoadingCovers={setLoadingCovers}
                animatedOnly={animatedOnly}
                coversError={coversError}
                setCoversError={setCoversError}
            />
        </div>
    );
}

function CoversGallery({
    loadingCovers,
    setLoadingCovers,
    animatedOnly,
    coversError,
    setCoversError,
}) {
    const currentCoverImage = () => {
        return { url: coverImageURL, preview: coverImageURL, previousSelection: true };
    };
    const { title, coverImageURL, setCoverImageURL, storeType, storeID, sgdbID, sgdbTitle } =
        useContext(GameEntryContext);
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

        const officialCoverReq = getOfficialCoverImageURL(storeType, storeID);

        const params = new URLSearchParams({ sgdbID });
        if (animatedOnly) params.append("animatedOnly", "true");

        const sgdbReq = fetch(`/api/steamgriddb/getGrids?${params}`).then((res) => {
            if (!res.ok) {
                if (res.status === 404) return []; // having no results is fine
                throw new Error(`Status ${res.status}, failed to fetch grids for id ${sgdbID}`);
            }
            return res.json();
        });

        // Request the store's cover, and SGDB covers. Then assemble the covers to display;
        // If there is already a selected cover (coverImageURL), it will always be inserted first.
        // Next is the store's cover. If no cover is selected yet, select it.
        // Then all the sgdb covers.
        // .officialOf and .previousSelection are used for their respective [Badges].
        Promise.all([officialCoverReq, sgdbReq])
            .then(([officialCoverImage, sgdbImages]) => {
                let covers = [];
                if (coverImageURL && coverImageURL !== officialCoverImage?.url) {
                    covers.push(currentCoverImage());
                }
                if (officialCoverImage) {
                    if (!coverImageURL) setCoverImageURL(officialCoverImage.url);
                    else if (coverImageURL === officialCoverImage.url)
                        officialCoverImage.previousSelection = true;
                    officialCoverImage.officialOf = sgdbID;
                    covers.push(officialCoverImage);
                }
                covers.push(...sgdbImages.filter((img) => img.url !== coverImageURL));

                setImages(covers);
            })
            .catch((err) => {
                console.warn(err);
                setCoversError(err);
            })
            .finally(() => setLoadingCovers(false));
    }, [sgdbID, animatedOnly]);

    if (loadingCovers) return <Spinner />;
    if (!images.length) {
        if (coversError) return <div>{"" + coversError}</div>;
        if (sgdbID) return <div>Entry has no covers</div>;
        else
            return <div style={{ userSelect: "none" }}>To browse covers, first select a game.</div>; // no selected entry and no error, means no search has been done yet
    }

    return (
        <div className="covers-gallery">
            {images.slice(0, 48).map((img) => {
                const sharedProps = {
                    src: img.preview,
                    onClick: () => setCoverImageURL(img.url),
                };
                const coverDisplay = img.preview.includes(".webm") ? (
                    <video {...sharedProps} autoPlay loop />
                ) : (
                    <img {...sharedProps} alt="Game Cover Art" />
                );

                const classes = ["cover-wrapper"];
                if (img.url === coverImageURL) classes.push("selected-cover");
                if (img.officialOf === sgdbID) classes.push("official-cover");
                if (img.previousSelection === true) classes.push("previous-cover");
                return (
                    <div key={img.url} className={classes.join(" ")}>
                        {coverDisplay}
                    </div>
                );
            })}
        </div>
    );
}
