import { useEffect, useRef } from "react";
import { tagTypes } from "../models/TagTypes.jsx";
import { useValidatedImage } from "../hooks/useValidatedImage.js";
import "../App.css";
import "./GameGrid.css";
import { Dialogs, dialogStore } from "./Dialogs/DialogStore.jsx";
import { observer } from "mobx-react-lite";
import { useFilterStore } from "../stores/FilterStore.jsx";

function GameCard({ game, className = "" }) {
    const gameCover = useValidatedImage(game.coverImageURL);
    const handleDrop = (e) => {
        const tagName = e.dataTransfer.getData("tagName");
        const tagTypeKey = e.dataTransfer.getData("tagTypeKey");
        tagTypes[tagTypeKey].addToGame(game, tagName);
    };
    const openGamePageDialog = () => {
        dialogStore.open(Dialogs.Playfrens, { game });
    };
    return (
        <button
            className={"game-card" + className}
            onClick={openGamePageDialog}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <img
                draggable="false"
                alt={game.title + " Card"}
                referrerPolicy="no-referrer"
                src={gameCover}
            />
            <p className="game-card-title-overlay">{game.title}</p>
        </button>
    );
}

export const GamesGrid = observer(() => {
    const filterStore = useFilterStore();
    const filteredGames = filterStore.filteredGames;
    const hoveredTagType = filterStore.hoveredTag.tagType;
    const hoveredTagName = filterStore.hoveredTag.tagName;
    const hoveredTagClassname = (game) => {
        // TODO: add setting check here after settings are implemented
        if (
            hoveredTagType &&
            hoveredTagName &&
            !filterStore.isTagSelected(hoveredTagType, hoveredTagName) &&
            game.hasTag(hoveredTagType, hoveredTagName)
        )
            return " tag-hovered";
        return "";
    };

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

    // need the empty div to contain the grid correctly
    return (
        <div className="games-grid-container">
            <div className="games-grid" ref={gridRef}>
                {filteredGames.map((game, index) => (
                    <GameCard className={hoveredTagClassname(game)} key={index} game={game} />
                ))}
            </div>
        </div>
    );
});
