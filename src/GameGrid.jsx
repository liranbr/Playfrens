import "./App.css";
import "./GameGrid.css";
import { Button, Col, Form, Modal, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { useEffect, useRef, useState } from "react";
import { GameObject } from "./Store.jsx";
import { dataTypes } from "./DataTypes.jsx";
import { observer } from "mobx-react-lite";
import { MdAdd, MdClose } from "react-icons/md";

const GameNoteArea = observer(({ game }) => {
    const [note, setNote] = useState(game.note);
    const handleNoteChange = (e) => {
        game.setNote(e.target.value);
        setNote(game.note);
    };
    return (
        <textarea className="game-note" placeholder="Note" rows={5}
                  value={note} onChange={handleNoteChange} />
    );
});

const ModalSidebarGroup = observer(({ game, dataType }) => {
    const title = dataType.plural.toUpperCase();
    const gameDataList = dataType.gameDataList(game);
    const handleRemove = (item) => {
        dataType.remove(game, item);
    };
    const handleAdd = (item) => {
        dataType.add(game, item.target.value);
    };
    const selectRef = useRef(null);
    return (
        <Row className="sidebar-group">
            <div className="sidebar-top-panel">
                <p className="sidebar-title">{title}</p>
                <div className="ms-auto">
                    <button className={"icon-button"}>
                        <MdAdd />
                        <Form.Select
                            ref={selectRef}
                            onChange={handleAdd}
                            style={{
                                position: "absolute",
                                opacity: 0, // Invisible but clickable, positioned in the button
                                cursor: "pointer",
                                height: "100%",
                                width: "30px",
                                top: 0,
                                right: 0,
                                padding: 0
                            }}
                        >
                            <option value="" hidden>Add a {dataType.single}</option>
                            {dataType.allDataList.filter(item => !gameDataList.includes(item)).map(item => (
                                <option key={String(item)} value={String(item)}>{item}</option>
                            ))}
                        </Form.Select>
                    </button>
                </div>
            </div>
            <div className="sidebar-buttons-list">
                {gameDataList.map((item, index) =>
                    <OverlayTrigger
                        key={"btn-modal-" + dataType.key + "-" + item + "-" + index}
                        overlay={() => (<Tooltip style={{ transition: "none" }}>
                            Click to remove
                        </Tooltip>)}>
                        <Button
                            value={item}
                            className="sidebar-button modal-sidebar-button"
                            draggable="true"
                            onClick={() => handleRemove(item)}>
                            {item}
                        </Button>
                    </OverlayTrigger>
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
                {/* need two background images to handle transparent border blurring */}
                <div className="modal-card-bg" style={{
                    "--bg-url": `url("${game.imageCoverPath}")`,
                    zIndex: -2,
                    filter: "blur(4px)",
                    transform: "scale(1.01)"
                }} />
                <div className="modal-card-bg" style={{
                    "--bg-url": `url("${game.imageCoverPath}")`,
                    zIndex: -1,
                    filter: "blur(8px)"
                }} />
                <Modal.Header style={{ padding: "14px" }}>
                    <Modal.Title
                        style={{
                            textAlign: "center",
                            fontWeight: "bold",
                            position: "absolute",
                            left: "50%",
                            transform: "translateX(-50%)"
                        }}
                    >
                        {game.title}
                    </Modal.Title>
                    <button className="icon-button ms-auto" onClick={handleHide}>
                        <MdClose />
                    </button>
                </Modal.Header>
                <Modal.Body
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "end",
                        padding: 0,
                        overflow: "auto"
                    }}>
                    <div className="w-100 d-flex overflow-auto">
                        <GameNoteArea game={game} />
                    </div>
                </Modal.Body>
                {/*footer needs to be sticky*/}
                <Modal.Footer style={{ position: "sticky", bottom: 0 }}>
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
            grid.style.justifyContent = isSingleRow ? "left" : "space-between";
        };

        updateGridJustification();
        window.addEventListener("resize", updateGridJustification);
    }, [filteredGames]);

    // need the empty div to contain the grid correctly
    return (
        <div style={{ width: "100%", overflowY: "auto" }}>
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