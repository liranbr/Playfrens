import "./App.css";
import "./GameGrid.css";
import {Button, Modal, Form, OverlayTrigger, Tooltip} from "react-bootstrap";
import {useEffect, useState} from "react";
import styled from "styled-components";
import {GameObject, allFriends, allCategories} from "./Store.jsx";
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
        background-image: ${({game}) =>
                `linear-gradient(rgba(0, 0, 0, 0.66), rgba(0, 0, 0, 0.66)), url("/cards/${game.title}.png")`};
        filter: blur(8px);
        transform: scale(1.02);
        // scale fixes the 5px of transparent border from the blur
    }
`;

function GameCard({game, onClick}) {
    const handleDrop = (e) => {
        const item = e.dataTransfer.getData('item');
        const dataType = e.dataTransfer.getData('dataType');
        console.log("Handling Drop! item and data type: " + item + ", " + dataType)
        if (dataType === 'friend')
            game.addFriend(item)
        else if (dataType === 'category')
            game.addCategory(item)
        else
            console.log("Drag Issue : not a friend or a category")
    }
    return (
        <>
            <button
                key={"gg-btn-" + game.title}
                className="game-card"
                onClick={() => onClick(game)}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
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

function ModalListButton({id, value, label, dataType, handleRemove, handleDragStart}) {
    const handleDrag = (e) => {
        handleDragStart(e, value, dataType)
    }
    const handleClick = (e) => {
        handleRemove(value);
    }
    return (
        <OverlayTrigger overlay={<Tooltip id="tooltip-disabled">Click to remove</Tooltip>}>
            <Button
                id={id}
                value={value}
                className="modal-list-button"
                draggable="true"
                onDragStart={handleDrag}
                onClick={handleClick}
            >
                {label}
            </Button>
        </OverlayTrigger>
    );
}

function ListAndAdder({game, dataType}) {
    if (dataType !== 'friend' && dataType !== 'category') {
        console.log("Error: dataType must be 'friend' or 'category'");
        return null;
    }
    const [cardTitle, innerList, fullList, addItem, removeItem] = dataType === 'friend'
        ? ['Friends', game.friends, allFriends, game.addFriend.bind(game), game.removeFriend.bind(game)]
        : ['Categories', game.categories, allCategories, game.addCategory.bind(game), game.removeCategory.bind(game)];

    const [list, setList] = useState(innerList);
    const updateList = () => setList([...innerList]);
    const [selectorValue, setSelectorValue] = useState("");
    const handleDragStart = () => {
        // will implement after Playthroughs are added and in modal
    };
    const handleAdderChange = (e) => {
        setSelectorValue(""); // reset the selector to 'Add...'
        addItem(e.target.value);
        updateList();
    };
    const handleRemove = (item) => {
        removeItem(item);
        updateList();
    }
    useEffect(updateList, [innerList]);

    return (
        <div className="sidebar">
            <div className="sidebar-card" style={{background: "none", maxHeight: "none"}}>
                <p className="sidebar-title"
                   style={{color: "#fff", textAlign: "left", padding: "5px 10px"}}>{cardTitle}</p>
                <div className="sidebar-buttons-list">
                    {list.map((data, index) =>
                        (<ModalListButton
                            key={"btn-modal-" + dataType + "-" + index}
                            id={"btn-modal-" + dataType + "-" + index}
                            value={data}
                            label={data}
                            dataType={'friend'}
                            handleRemove={handleRemove}
                            handleDragStart={handleDragStart}
                        />)
                    )}

                    <Form.Select value={selectorValue} onChange={handleAdderChange}>
                        <option value="" hidden>Add...</option>
                        {fullList.filter(item => !list.includes(item))
                            .map((item, index) => (
                                <option key={game.title + "-" + dataType + "-option-" + index}
                                        value={String(item)}>{item}</option>
                            ))}
                    </Form.Select>
                </div>
            </div>
        </div>
    )

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
                    <Modal.Body style={{display: "flex", flexDirection: "row", padding: 0}}>
                        <ListAndAdder game={modalGame} dataType="friend"></ListAndAdder>
                        <ListAndAdder game={modalGame} dataType="category"></ListAndAdder>
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

GamesGrid.propTypes = {
    filteredGames: PropTypes.array.isRequired,
}
