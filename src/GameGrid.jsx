import "./GameGrid.css";
import { Button, Modal } from "react-bootstrap";
import { useState } from "react";
import styled from "styled-components";

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

const ModalCard = styled(Modal)`
    .modal-content {
        height: 900px;
        position: relative;
        overflow: hidden;
        z-index: 1;
        box-shadow: 0 0 50px rgba(0, 0, 0, 1);
        border: none;
    }
    .modal-dialog {
        --bs-modal-width: 600px;
    }
    .modal-content::before {
        // using ::before to make a blurred background
        content: "";
        position: absolute;
        height: 100%;
        width: 100%;
        background-size: cover;
        background-position: center;
        z-index: -1;
        background-image: ${({ game }) =>
            `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/cards/${game}.png")`};
        filter: blur(5px);
        transform: scale(1.02);
        // scale fixes the 5px of transparent border from the blur
    }
`;

function GameCard(game, handleShowModal) {
    return (
        <>
            <button
                key={game}
                className="game-card"
                onClick={() => handleShowModal(game)}
            >
                <img
                    draggable="false"
                    src={`/cards/${game}.png`}
                    alt={`${game} Game Cover`}
                />
            </button>
        </>
    );
}

export function GamesGrid() {
    const [show, setShow] = useState(false);
    const [modalGame, setModalGame] = useState(null);
    const handleClose = () => setShow(false);
    const handleShow = (game) => {
        setModalGame(game);
        setShow(true);
    };
    return (
        <div className="games-grid">
            {games.map((game) => GameCard(game, handleShow))}
            <ModalCard
                game={modalGame}
                show={show}
                onHide={handleClose}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title
                        style={{
                            marginLeft: "32px",
                            textAlign: "center",
                            fontWeight: "bold",
                            width: "100%",
                        }}
                    >
                        {modalGame}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body style={{ display: "flex", flexDirection: "row" }}>
                    <p>
                        [Placeholder for Form about game details, categories,
                        friends, etc]
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleClose}>
                        Save
                    </Button>
                </Modal.Footer>
            </ModalCard>
        </div>
    );
}
