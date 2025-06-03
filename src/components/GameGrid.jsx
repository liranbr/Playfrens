import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button, Modal, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { GameObject } from "../models/GameObject.jsx";
import { dataTypes } from "../models/DataTypes.jsx";
import { MdAdd, MdClose, MdDeleteOutline, MdEdit, MdMoreVert } from "react-icons/md";
import { useValidatedImage } from "../hooks/useValidatedImage.js";
import { EditGameModal } from "./EditGameModal.jsx";
import { removeGame } from "../Store.jsx";
import "../App.css";
import "./GameGrid.css";
import { OutlinedIcon } from "./Components.jsx";

const AddDataDropdown = ({ dataType, game }) => {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="icon-button">
                    <MdAdd />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content className="dropdown-menu show"
                                      align={"start"} side={"bottom"} sideOffset={5}
                                      style={{ zIndex: 1111, pointerEvents: "auto" }}>
                    {dataType.allDataList.filter(item => !dataType.gameDataList(game).includes(item)).map(item => (
                        <DropdownMenu.Item key={item} className="dropdown-item" onClick={() => {
                            dataType.addToGame(game, item);
                        }}>
                            {item}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

const CardModalSidebarGroup = observer(({ game, dataType }) => {
    const title = dataType.plural.toUpperCase();
    const gameDataList = dataType.gameDataList(game);
    const handleRemove = (item) => {
        dataType.removeFromGame(game, item);
    };
    return (
        <Row className="sidebar-group pfm-shadow">
            <div className="sidebar-header position-relative">
                <div />
                <h4 className="sidebar-title text-stroke-1px">{title}</h4>
                <AddDataDropdown dataType={dataType} game={game} />
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

function GameOptionsButton({ game, setShowCardModal, setShowEditGameModal }) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="icon-button">
                    <OutlinedIcon>
                        <MdMoreVert />
                    </OutlinedIcon>
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content className="dropdown-menu show"
                                      align={"start"} side={"bottom"} sideOffset={5}
                                      style={{ zIndex: 1111 }}>
                    <DropdownMenu.Item className="dropdown-item" onClick={() => {
                        setShowCardModal(false);
                        setShowEditGameModal(true);
                    }}>
                        <MdEdit className="dropdown-item-icon" />
                        Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Item className="dropdown-item danger-item" onClick={() => {
                        setShowCardModal(false);
                        removeGame(game);
                    }}>
                        <MdDeleteOutline className="dropdown-item-icon danger-item" />
                        Delete
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

const CardModal = observer(({ game, show, setShow, setShowEditGameModal }) => {
    const gameCover = useValidatedImage(game.coverImageURL);
    const handleHide = () => {
        setShow(false);
    };

    return (
        <Modal className={"playfrens-modal pfm-shadow"} show={show} onHide={handleHide} centered>
            <div className="pfm-sidebar">
                <CardModalSidebarGroup dataType={dataTypes.friend} game={game} />
            </div>

            <div className="pfm-card" style={{ "--bg-url": `url("${gameCover}")` }}>
                {/* need two background images to handle transparent border blurring */}
                <div className="pfm-card-bg layer1" />
                <div className="pfm-card-bg layer2" />
                <div className="pfm-header">
                    <GameOptionsButton game={game}
                                       setShowCardModal={setShow}
                                       setShowEditGameModal={setShowEditGameModal} />
                    <p className="pfm-title text-stroke-1px">
                        {game.title}
                    </p>
                    <button className="icon-button ms-auto" onClick={handleHide}>
                        <OutlinedIcon>
                            <MdClose />
                        </OutlinedIcon>
                    </button>
                </div>
                <div className="pfm-body">
                    <div className="w-100 d-flex overflow-auto">
                        <textarea className="game-note" placeholder="Note" rows={4} spellCheck={false} value={game.note}
                                  onChange={(e) => game.setNote(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="pfm-sidebar">
                <CardModalSidebarGroup dataType={dataTypes.category} game={game} />
                <CardModalSidebarGroup dataType={dataTypes.status} game={game} />
            </div>
        </Modal>
    );
});

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
    const [showCardModal, setShowCardModal] = useState(false);
    const [showEditGameModal, setShowEditGameModal] = useState(false);
    const [modalGame, setModalGame] = useState(new GameObject("[no game]"));
    const handleShowCardModal = (game) => {
        setModalGame(game);
        setShowCardModal(true);
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
                <CardModal game={modalGame} show={showCardModal} setShow={setShowCardModal}
                           setShowEditGameModal={setShowEditGameModal} />
                <EditGameModal game={modalGame} show={showEditGameModal} setShow={setShowEditGameModal}
                               setShowCardModal={setShowCardModal} />
            </div>
        </div>
    );
}