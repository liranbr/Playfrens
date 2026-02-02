import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { MdAddCircleOutline } from "react-icons/md";
import {
    useFilterStore,
    useSettingsStore,
    Dialogs,
    globalDialogStore,
    updateTagBothGameCounters,
    useDataStore,
} from "@/stores";
import { toastError } from "@/Utils.jsx";
import { SlGameController } from "react-icons/sl";
import { SimpleTooltip } from "@/components/common/SimpleTooltip.jsx";
import { GameCoverImage } from "@/components/GameCoverImage.jsx";
import "../App.css";
import "./GameGrid.css";

const GameCard = observer(({ game }) => {
    const [draggedOver, setDraggedOver] = useState(false);
    const filterStore = useFilterStore();
    const { draggedTag, hoveredTag } = filterStore;
    const hoverTagSetting = useSettingsStore().tagHoverGameHighlight;

    const hasPartyWithoutTag = (tag) => game.parties.some((party) => !party.hasTag(tag));
    const allPartiesHaveTag = (tag) => !hasPartyWithoutTag(tag);

    const classes = ["game-card"];
    if (draggedTag) {
        if (allPartiesHaveTag(draggedTag)) classes.push("has-dragged-tag");
        else classes.push("doesnt-have-dragged-tag");
    }
    if (hoverTagSetting !== "none" && hoveredTag) {
        if (hoverTagSetting === "highlight" && game.hasTag(hoveredTag)) classes.push("highlight");
        else if (hoverTagSetting === "darken" && !game.hasTag(hoveredTag)) classes.push("darken");
    }
    if (draggedOver) classes.push("dragged-over");

    let partiesBadge = "";
    if (filterStore.areFiltersActive) {
        const partiesAmount = game.parties.length;
        const filteredPartiesAmount = game.parties.filter((party) =>
            filterStore.doesPartyPassFilters(party),
        ).length;
        if (partiesAmount > filteredPartiesAmount)
            partiesBadge = filteredPartiesAmount + "/" + partiesAmount;
    }

    const handleDrop = () => {
        setDraggedOver(false);
        if (game.parties.length === 1) {
            game.parties[0].addTag(draggedTag); // just 1 party, can attempt to add directly
            updateTagBothGameCounters(draggedTag);
        } else if (hasPartyWithoutTag(draggedTag))
            globalDialogStore.open(Dialogs.ChoosePartyToAddTag, { game: game, tag: draggedTag });
        else
            toastError(
                `${draggedTag.name} is already a ${draggedTag.typeStrings.single} for all of ${game.title}'s Groups`,
            );
    };
    const openGamePageDialog = () => {
        globalDialogStore.open(Dialogs.GamePage, { game });
    };

    return (
        <div className="game-card-grid-cell">
            <button
                className={classes.join(" ")}
                onClick={openGamePageDialog}
                onDrop={handleDrop}
                onDragOver={(e) => {
                    setDraggedOver(true);
                    e.preventDefault();
                }}
                onDragLeave={() => setDraggedOver(false)}
            >
                <GameCoverImage src={game.coverImageURL} />
                <p className="game-card-title-overlay">{game.title}</p>
                {partiesBadge && (
                    <SimpleTooltip message="Groups that pass filters" delayDuration={0}>
                        <p className="filtered-parties-badge">{partiesBadge}</p>
                    </SimpleTooltip>
                )}
                <MdAddCircleOutline className="drag-indicator" />
            </button>
        </div>
    );
});

function EmptyGridPlaceholder() {
    const dataStore = useDataStore();
    const noGamesAddedYet = "No games added yet";
    const noFilteredResults = "No Results";
    const message = dataStore.allGames.size === 0 ? noGamesAddedYet : noFilteredResults;
    return (
        <span className="empty-grid-placeholder">
            <SlGameController />
            <p>{message}</p>
        </span>
    );
}

export const GamesGrid = observer(() => {
    const { filteredGames } = useFilterStore();

    // useEffect to update the grid justification if there aren't enough items to fill the row
    const gridRef = useRef(null);
    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;

        const updateGridJustification = () => {
            const styles = getComputedStyle(grid);
            const rows = styles.getPropertyValue("grid-template-rows").trim().split(" ");
            const isSingleRow = rows.length === 1;
            grid.style.justifyContent = isSingleRow ? "left" : "space-between";
        };

        updateGridJustification();
        window.addEventListener("resize", updateGridJustification);
    }, [filteredGames]);

    return (
        <div className="games-grid-container">
            <div className="games-grid" ref={gridRef}>
                {filteredGames.map((game, index) => (
                    <GameCard game={game} key={index} />
                ))}
            </div>
            {filteredGames.length === 0 && <EmptyGridPlaceholder />}
        </div>
    );
});
