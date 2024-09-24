import "./GameGrid.css";
import { Button, Modal } from "react-bootstrap";
import { useState } from "react";

const games = [
    "Baldur's Gate 3",
    "Celeste",
    "CrossCode",
    "Dark Souls I Remastered",
    "Dead Cells",
    "Hades",
    "Heroes of the Storm",
    "Hollow Knight",
    "Outer Wilds",
    "Sekiro - Shadows Die Twice",
    "Subnautica",
    "Tears of the Kingdom",
    "Terraria",
    "Tunic",
    "The Witcher 3",
];

function GameCard(game) {
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <>
            <button key={game} className="game-card" onClick={handleShow}>
                <img
                    draggable="false"
                    src={`/cards/${game}.png`}
                    alt={`${game} Game Cover`}
                />
            </button>
            <Modal show={show} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>{game}</Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ display: "flex", flexDirection: "row" }}>
                    <img
                        draggable="false"
                        src={`/cards/${game}.png`}
                        alt={`${game} Game Cover`}
                        style={{
                            width: "100%",
                            height: "100%",
                            marginRight: "10px",
                        }}
                    />
                    <div>
                        <p>
                            [Placeholder for Form about game details,
                            categories, friends, etc]
                        </p>
                        <div
                            style={{
                                position: "absolute",
                                bottom: "1rem",
                                right: "1rem",
                            }}
                        >
                            <Button variant="primary" onClick={handleClose}>
                                Save
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}

export function GamesGrid() {
    return (
        <div className="games-grid">{games.map((game) => GameCard(game))}</div>
    );
}
