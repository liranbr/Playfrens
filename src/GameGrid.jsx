import "./GameGrid.css";
import {Button, Modal} from "react-bootstrap";
import {useState} from "react";
import styled from "styled-components";
import {allGames, GameObject} from "./Store.jsx";
import PropTypes from "prop-types";


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
        background-image: ${({game}) =>
                `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url("/cards/${game.title}.png")`};
        filter: blur(5px);
        transform: scale(1.02);
        // scale fixes the 5px of transparent border from the blur
    }
`;

function GameCard({game, onClick}) {
    return (
        <>
            <button
                key={"gg-btn-" + game.title}
                className="game-card"
                onClick={() => onClick(game)}
            >
                <img
                    draggable="false"
                    src={`/cards/${game.title}.png`}
                    alt={`${game.title} Game Cover`}
                />
            </button>
        </>
    );
}

GameCard.propTypes = {
    game: PropTypes.instanceOf(GameObject).isRequired,
    onClick: PropTypes.func.isRequired,
}

export function GamesGrid({filteredGames}) {
    const [showModal, setShowModal] = useState(false);
    const [modalGame, setModalGame] = useState(new GameObject("Default"));
    const handleClose = () => setShowModal(false);
    const handleShow = (game) => {
        setModalGame(game);
        setShowModal(true);
    };
    return (
        <div>
            <div className="games-grid">
                {filteredGames.map((game) => (<GameCard
                    key={"gg-gc-" + game.title}
                    game={game}
                    onClick={handleShow}/>))}
                <ModalCard
                    game={modalGame}
                    show={showModal}
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
                            {modalGame.title}
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{display: "flex", flexDirection: "row"}}>
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
        </div>
    );
}
