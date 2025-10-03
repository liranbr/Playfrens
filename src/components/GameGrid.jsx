import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { MdAddCircleOutline } from "react-icons/md";
import {
    useFilterStore,
    useSettingsStore,
    Dialogs,
    globalDialogStore,
    updateTagBothGameCounters,
} from "@/stores";
import { TagObject } from "@/models";
import { useValidatedImage } from "@/hooks/useValidatedImage.js";
import "../App.css";
import "./GameGrid.css";

const GameCard = observer(({ game }) => {
    const [draggedOver, setDraggedOver] = useState(false);
    const { draggedTag, hoveredTag } = useFilterStore();
    const hoverTagSetting = useSettingsStore().tagHoverGameHighlight;

    const classes = ["game-card"];
    if (draggedTag) {
        if (game.hasTag(draggedTag)) classes.push("has-dragged-tag");
        else classes.push("doesnt-have-dragged-tag");
    }
    if (hoverTagSetting !== "none" && hoveredTag) {
        if (hoverTagSetting === "highlight" && game.hasTag(hoveredTag)) classes.push("highlight");
        else if (hoverTagSetting === "darken" && !game.hasTag(hoveredTag)) classes.push("darken");
    }
    if (draggedOver) classes.push("dragged-over");

    const gameCover = useValidatedImage(game.coverImageURL);
    const handleDrop = () => {
        setDraggedOver(false);
        game.addTag(draggedTag);
        updateTagBothGameCounters(draggedTag);
    };
    const openGamePageDialog = () => {
        globalDialogStore.open(Dialogs.GamePage, { game });
    };

    return (
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
});

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
        </div>
    );
});
