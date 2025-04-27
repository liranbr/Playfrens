import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button, Modal, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { GameObject } from "../models/GameObject.jsx";
import { dataTypes } from "../models/DataTypes.jsx";
import { MdAdd, MdClose } from "react-icons/md";
import { useValidatedImage } from "../hooks/useValidatedImage.js";
import "../App.css";
import "./GameGrid.css";

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
        <Row className="sidebar-group pfm-shadow">
            <div className="sidebar-header position-relative">
                <div />
                <h4 className="sidebar-title">{title}</h4>
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
                        placement={"right"}
                        overlay={<Tooltip style={{ transition: "none" }}>
                            Remove
                        </Tooltip>}>
                        <Button
                            value={item}
                            className="sidebar-button pfm-sidebar-button"
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
    const gameCover = useValidatedImage(game.coverImagePath);

    return (
        <Modal className={"playfrens-modal pfm-shadow"} show={show} onHide={handleHide} centered>
            <div className="pfm-sidebar">
                <ModalSidebarGroup dataType={dataTypes.friend} game={game} />
            </div>

            <div className="pfm-card" style={{ "--bg-url": `url("${gameCover}")` }}>
                {/* need two background images to handle transparent border blurring */}
                <div className="pfm-card-bg layer1" />
                <div className="pfm-card-bg layer2" />
                <div className="pfm-header">
                    <div />
                    <p className="pfm-title">
                        {game.title}
                    </p>
                    <button className="icon-button ms-auto" onClick={handleHide}>
                        <MdClose />
                    </button>
                </div>
                <div className="pfm-body">
                    <div className="w-100 d-flex overflow-auto">
                        <textarea className="game-note" placeholder="Note" rows={5} value={game.note}
                                  onChange={(e) => game.setNote(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="pfm-sidebar">
                <ModalSidebarGroup dataType={dataTypes.category} game={game} />
                <ModalSidebarGroup dataType={dataTypes.status} game={game} />
            </div>
        </Modal>
    );
});

function GameCard({ game, onClick }) {
    const gameCover = useValidatedImage(game.coverImagePath);
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
                src={gameCover}
                alt={game.title + " Card"}
            />
            <span className="game-card-title-overlay">{game.title}</span>
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