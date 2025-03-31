import "./App.css";
import "./GameGrid.css";
import { Button, Form, Modal, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useState } from "react";
import styled from "styled-components";
import { GameObject } from "./Store.jsx";
import { dataTypes } from "./dataTypes.jsx";
import { observer } from "mobx-react-lite";

// Styled Components create unused CSS warnings, but they are used in the JSX
// noinspection CssUnusedSymbol
const ModalCard = styled(Modal)`
    .modal-content {
        height: 900px;
        position: relative;
        overflow: hidden;
        z-index: 1;
        box-shadow: 0 0 50px rgba(0, 0, 0, 1);
        border: none;
    }

    .modal-header, .modal-footer {
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
                `linear-gradient(rgba(0, 0, 0, 0.66), rgba(0, 0, 0, 0.66)), url("${game.imageCoverPath}")`};
        filter: blur(8px);
        transform: scale(1.02);
        // scale fixes the 5px of transparent border from the blur
    }
`;

function GameCard({ game, onClick }) {
    const handleDrop = (e) => {
        const item = e.dataTransfer.getData("item");
        const dataTypeKey = e.dataTransfer.getData("dataTypeKey");
        dataTypes[dataTypeKey].add(game, item);
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
                src={game.imageCoverPath}
                alt={game.title + " Card"}
            />
        </button>
    );
}

function ModalListButton({ value, dataType, handleRemove }) {
    return (
        <OverlayTrigger overlay={<Tooltip>Click to remove</Tooltip>}>
            <Button
                id={"btn-modal-" + dataType + "-" + value}
                value={value}
                className="modal-list-button"
                draggable="true"
                onClick={() => handleRemove(value)}
            >
                {value}
            </Button>
        </OverlayTrigger>
    );
}

const ListAndAdder = observer(({ game, dataType }) => {
    console.log(dataType);
    const cardTitle = dataType.plural;
    const allDataList = dataType.allDataList;
    const gameDataList = dataType.gameDataList(game);
    console.log("game data list: " + gameDataList);
    const handleAdderChange = (e) => {
        dataType.add(game, e.target.value);
    };
    const handleRemove = (item) => {
        dataType.remove(game, item);
    };

    return (
        <div className="sidebar">
            <div className="sidebar-group" style={{ background: "none", maxHeight: "none" }}>
                <p className="sidebar-title"
                   style={{ color: "#fff", textAlign: "left", padding: "5px 10px" }}>{cardTitle}</p>
                <div key={"gameDataList" + gameDataList.length} className="sidebar-buttons-list">
                    {gameDataList.map((data, index) =>
                        (<ModalListButton
                            key={index}
                            value={data}
                            dataTypeKey={dataType.key}
                            handleRemove={handleRemove}
                        />)
                    )}

                    <Form.Select onChange={handleAdderChange}>
                        <option value="" hidden>Add...</option>
                        {allDataList.filter(item => !gameDataList.includes(item))
                            .map((item, index) => (
                                <option key={index}
                                        value={String(item)}>{item}</option>
                            ))}
                    </Form.Select>
                </div>
            </div>
        </div>
    );
});

function GameModal({ game, show, handleHide }) {
    return (
        <ModalCard
            game={game}
            show={show}
            onHide={handleHide}
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title
                    style={{
                        marginLeft: "32px",
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "100%"
                    }}
                >
                    {game.title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ display: "flex", flexDirection: "column", padding: 0 }}>
                <ListAndAdder game={game} dataType={dataTypes.friend}></ListAndAdder>
                <ListAndAdder game={game} dataType={dataTypes.category}></ListAndAdder>
                <ListAndAdder game={game} dataType={dataTypes.status}></ListAndAdder>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={handleHide}>
                    Save
                </Button>
            </Modal.Footer>
        </ModalCard>
    );
}

export function GamesGrid({ filteredGames }) {
    const [showModal, setShowModal] = useState(false);
    const [modalGame, setModalGame] = useState(new GameObject("[no game]"));
    const handleHideModal = () => setShowModal(false);
    const handleShowModal = (game) => {
        setModalGame(game);
        setShowModal(true);
    };
    return (
        <div>
            <div className="games-grid">
                {filteredGames.map((game, index) => (<GameCard
                    key={index}
                    game={game}
                    onClick={handleShowModal} />))}
                <GameModal game={modalGame} show={showModal} handleHide={handleHideModal} />
            </div>
        </div>
    );
}
