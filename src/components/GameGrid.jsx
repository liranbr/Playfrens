import { useEffect, useRef } from "react";
import { observer } from "mobx-react-lite";
import { useFilterStore, useSettingsStore } from "@/stores";
import { Dialogs, dialogStore } from "./Dialogs/DialogStore.jsx";
import { tagTypes } from "@/models";
import { ScrollView } from "@/components";
import { useValidatedImage } from "@/hooks/useValidatedImage.js";
import "../App.css";
import "./GameGrid.css";

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
    const settingsStore = useSettingsStore();
    const filteredGames = filterStore.filteredGames;
    const hoveredTagClassname = (game) => {
        const hoverTagSetting = settingsStore.TagHoverGameHighlight;
        const hoveredTagType = filterStore.hoveredTag.tagType;
        const hoveredTagName = filterStore.hoveredTag.tagName;
        if (
            hoverTagSetting !== "none" &&
            hoveredTagType &&
            hoveredTagName
            // !filterStore.isTagSelected(hoveredTagType, hoveredTagName) &&
        ) {
            if (hoverTagSetting === "highlight" && game.hasTag(hoveredTagType, hoveredTagName))
                return " highlight";
            if (hoverTagSetting === "darken" && !game.hasTag(hoveredTagType, hoveredTagName))
                return " darken";
        }

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

    return (
        <ScrollView>
            <div className="games-grid" ref={gridRef}>
                {filteredGames.map((game, index) => (
                    <GameCard className={hoveredTagClassname(game)} key={index} game={game} />
                ))}
            </div>
        </ScrollView>
    );
});
