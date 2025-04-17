import "./App.css";
import "./GameGrid.css";
import { Button, Col, Form, Modal, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import { GameObject } from "./Store.jsx";
import { dataTypes } from "./DataTypes.jsx";
import { observer } from "mobx-react-lite";
import { ButtonAdd } from "./Components.jsx";

function ModalListButton({ value, dataType, handleRemove }) {
    return (
        <OverlayTrigger overlay={<Tooltip style={{ transition: "none" }}>Click to remove</Tooltip>}>
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
    const cardTitle = dataType.plural;
    const allDataList = dataType.allDataList;
    const gameDataList = dataType.gameDataList(game);
    console.log("ListAndAdder data type:" + dataType.key + ",\ngame data list: " + gameDataList);
    const selectRef = useRef(null);
    const handleAdderChange = (e) => {
        dataType.add(game, e.target.value);
    };
    const handleRemove = (item) => {
        dataType.remove(game, item);
    };

    return (
        <div className="modal-list">
            <div className="title-and-adder">
                <p className="modal-list-title">{cardTitle}</p>
                <OverlayTrigger overlay={<Tooltip style={{ transition: "none" }}>Add a {dataType.single}</Tooltip>}>
                    <div style={{ position: "relative" }}>
                        <ButtonAdd>
                            <Form.Select
                                ref={selectRef}
                                onChange={handleAdderChange}
                                style={{
                                    position: "absolute",
                                    opacity: 0, // Invisible but clickable, positioned in the button
                                    cursor: "pointer",
                                    height: "100%",
                                    width: "100%",
                                    top: 0,
                                    left: 0
                                }}
                            >
                                <option value="" hidden>Add a {dataType.single}</option>
                                {allDataList.filter(item => !gameDataList.includes(item)).map(item => (
                                    <option key={String(item)} value={String(item)}>{item}</option>
                                ))}
                            </Form.Select>
                        </ButtonAdd>
                    </div>
                </OverlayTrigger>
            </div>
            <div key={"gameDataList" + gameDataList.length} className="sidebar-buttons-list">
                {gameDataList.map((data, index) =>
                    (<ModalListButton
                        key={index}
                        value={data}
                        dataTypeKey={dataType.key}
                        handleRemove={handleRemove}
                    />)
                )}
            </div>
        </div>
    );
});

const GameNoteArea = observer(({ game }) => {
    const [note, setNote] = useState(game.note);
    const handleNoteChange = (e) => {
        game.setNote(e.target.value);
        setNote(game.note);
    };
    return (
        <textarea className="game-note" placeholder="Note" rows={3}
                  value={note} onChange={handleNoteChange} />
    );
});

const ModalSidebarGroup = observer(({ game, dataType }) => {
    const title = dataType.plural.toUpperCase();
    const gameDataList = dataType.gameDataList(game);
    const handleRemove = (item) => {
        dataType.remove(game, item);
    };
    return (
        <Row className="sidebar-group">
            <p className="sidebar-title">{title}</p>
            <div className="sidebar-buttons-list">
                {gameDataList.map((item, index) =>
                    <ModalListButton
                        key={index}
                        value={item}
                        dataTypeKey={dataType.key}
                        handleRemove={handleRemove}
                    />
                )}
            </div>
        </Row>
    );
});

const GameModal = observer(({ game, show, handleHide }) => {
    return (
        <Modal className={"pf-modal"} show={show} onHide={handleHide} centered>
            <div className="modal-sidebar">
                <ModalSidebarGroup dataType={dataTypes.friend} game={game} />
            </div>
            <div className="modal-card">
                <div className="modal-card-bg" style={{
                    "--bg-url": `url("${game.imageCoverPath}")`,
                    zIndex: -2
                }} />
                <div className="modal-card-bg" style={{
                    "--bg-url": `url("${game.imageCoverPath}")`,
                    zIndex: -1,
                    filter: "blur(8px)"
                }} />
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
                <Modal.Body
                    style={{ display: "flex", flexDirection: "column", justifyContent: "end", padding: 0 }}>
                    <Row id="playthroughs">
                        <GameNoteArea game={game} />
                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={handleHide}>
                        Save
                    </Button>
                </Modal.Footer>
            </div>
            <div className="modal-sidebar">
                <ModalSidebarGroup dataType={dataTypes.category} game={game} />
                <ModalSidebarGroup dataType={dataTypes.status} game={game} />
            </div>
        </Modal>
    );
});

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

export function GamesGrid({ filteredGames }) {
    const [showModal, setShowModal] = useState(false);
    const [modalGame, setModalGame] = useState(new GameObject("[no game]"));
    const handleHideModal = () => setShowModal(false);
    const handleShowModal = (game) => {
        setModalGame(game);
        setShowModal(true);
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
            grid.style.justifyContent = isSingleRow ? "start" : "space-between";
        };

        updateGridJustification();
        window.addEventListener("resize", updateGridJustification);
    }, [filteredGames]);

    // need the empty div to contain the grid correctly
    return (
        <div style={{ width: "100%", overflow: "scroll" }}>
            <div className="games-grid" ref={gridRef}>
                {filteredGames.map((game, index) => (<GameCard
                    key={index}
                    game={game}
                    onClick={handleShowModal} />))}
                <GameModal game={modalGame} show={showModal} handleHide={handleHideModal} />
            </div>
        </div>
    );
}