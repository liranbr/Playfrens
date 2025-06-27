import { useEffect, useRef } from "react";
import { dataTypes } from "../models/DataTypes.jsx";
import { useValidatedImage } from "../hooks/useValidatedImage.js";
import "../App.css";
import "./GameGrid.css";
import { Modals, modalStore } from "./Modals/ModalStore.jsx";

function GameCard({ game }) {
    const gameCover = useValidatedImage(game.coverImageURL);
    const handleDrop = (e) => {
        const item = e.dataTransfer.getData("item");
        const dataTypeKey = e.dataTransfer.getData("dataTypeKey");
        dataTypes[dataTypeKey].addToGame(game, item);
    };
    const openPlayfrensModal = () => {
        modalStore.open(Modals.Playfrens, { game });
    };
    return (
        <button className="game-card"
                onClick={openPlayfrensModal}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}>
            <img draggable="false" alt={game.title + " Card"} referrerPolicy="no-referrer"
                 src={gameCover} />
            <span className="game-card-title-overlay text-stroke-1px">{game.title}</span>
        </button>
    );
}

export function GamesGrid({ filteredGames }) {
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
        <div style={{ width: "100%", overflowY: "auto", scrollbarGutter: "stable" }}>
            <div className="games-grid" ref={gridRef}>
                {filteredGames.map((game, index) => (<GameCard key={index} game={game} />))}
            </div>
        </div>
    );
}