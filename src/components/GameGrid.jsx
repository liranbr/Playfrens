import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useFilterStore, useSettingsStore } from "@/stores";
import { Dialogs, dialogStore } from "./Dialogs/DialogStore.jsx";
import { tagTypes } from "@/models";
import { ScrollView } from "@/components";
import { useValidatedImage } from "@/hooks/useValidatedImage.js";
import "../App.css";
import "./GameGrid.css";
import { MdAddCircleOutline } from "react-icons/md";

function GameCard({ game, className = "" }) {
    const [draggedOver, setDraggedOver] = useState(false);
    const isDraggedOver = draggedOver ? " dragged-over" : "";
    const gameCover = useValidatedImage(game.coverImageURL);
    const handleDrop = (e) => {
        const tagName = e.dataTransfer.getData("tagName");
        const tagTypeKey = e.dataTransfer.getData("tagTypeKey");
        setDraggedOver(false);
        tagTypes[tagTypeKey].addToGame(game, tagName);
    };
    const openGamePageDialog = () => {
        dialogStore.open(Dialogs.Playfrens, { game });
    };
    return (
        <button
            className={"game-card" + className + isDraggedOver}
            onClick={openGamePageDialog}
            onDrop={handleDrop}
            onDragOver={(e) => {
                setDraggedOver(true);
                e.preventDefault();
            }}
            onDragLeave={() => setDraggedOver(false)}
        >
            <img
                draggable="false"
                alt={game.title + " Card"}
                referrerPolicy="no-referrer"
                src={gameCover}
            />
            <p className="game-card-title-overlay">{game.title}</p>
            <MdAddCircleOutline className="drag-indicator" />
        </button>
    );
}

export const GamesGrid = observer(() => {
    // TODO: After Tag UUIDs, move these classnames from the grid to the GameCard
    const filterStore = useFilterStore();
    const settingsStore = useSettingsStore();
    const filteredGames = filterStore.filteredGames;
    const draggedTagType = filterStore.draggedTag.tagType;
    const draggedTagName = filterStore.draggedTag.tagName;
    const draggedTagClassname = (game) => {
        if (draggedTagType && draggedTagName) {
            if (game.hasTag(draggedTagType, draggedTagName)) return " has-dragged-tag";
            else return " doesnt-have-dragged-tag";
        }
        return "";
    };
    const hoverTagSetting = settingsStore.tagHoverGameHighlight;
    const hoveredTagType = filterStore.hoveredTag.tagType;
    const hoveredTagName = filterStore.hoveredTag.tagName;
    const hoveredTagClassname = (game) => {
        if (hoverTagSetting !== "none" && hoveredTagType && hoveredTagName) {
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
                    <GameCard
                        className={draggedTagClassname(game) + hoveredTagClassname(game)}
                        key={index}
                        game={game}
                    />
                ))}
            </div>
        </ScrollView>
    );
});
