import { useEffect, useRef, useState } from "react";
import { GameObject } from "../models/GameObject.jsx";
import { dataTypes } from "../models/DataTypes.jsx";
import { useValidatedImage } from "../hooks/useValidatedImage.js";
import { EditGameModal } from "./EditGameModal.jsx";
import { PlayfrensModal } from "./PlayfrensModal";
import "../App.css";
import "./GameGrid.css";

function GameCard({ game, onClick }) {
    const gameCover = useValidatedImage(game.coverImageURL);
    const handleDrop = (e) => {
        const item = e.dataTransfer.getData("item");
        const dataTypeKey = e.dataTransfer.getData("dataTypeKey");
        dataTypes[dataTypeKey].addToGame(game, item);
    };
    return (
        <button
            className="game-card"
            onClick={() => onClick(game)}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
        >
            <img
                draggable="false"
                src={gameCover}
                alt={game.title + " Card"}
                referrerPolicy="no-referrer"
            />
            <span className="game-card-title-overlay text-stroke-1px">{game.title}</span>
        </button>
    );
}

export function GamesGrid({ filteredGames }) {
    const [showPlayfrensModal, setShowPlayfrensModal] = useState(false);
    const [showEditGameModal, setShowEditGameModal] = useState(false);
    const [modalGame, setModalGame] = useState(new GameObject("[no game]"));
    const handleShowCardModal = (game) => {
        setModalGame(game);
        setShowPlayfrensModal(true);
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
        <div style={{ width: "100%", overflowY: "auto", scrollbarGutter: "stable" }}>
            <div className="games-grid" ref={gridRef}>
                {filteredGames.map((game, index) => (<GameCard
                    key={index}
                    game={game}
                    onClick={handleShowCardModal} />))}
                {/* the modals can activate each other, when using the Edit functionality */}
                <PlayfrensModal game={modalGame} show={showPlayfrensModal} setShow={setShowPlayfrensModal}
                                setShowEditGameModal={setShowEditGameModal} />
                <EditGameModal game={modalGame} show={showEditGameModal} setShow={setShowEditGameModal}
                               setShowCardModal={setShowPlayfrensModal} />
            </div>
        </div>
    );
}