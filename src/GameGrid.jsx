import "./App.css";
import "./GameGrid.css";
import {Button, Modal, Form, OverlayTrigger, Tooltip} from "react-bootstrap";
import {useEffect, useState} from "react";
import styled from "styled-components";
import PropTypes from "prop-types";
import {GameObject, allFriends, allCategories} from "./Store.jsx";

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
        background-image: ${({game}) =>
                `linear-gradient(rgba(0, 0, 0, 0.66), rgba(0, 0, 0, 0.66)), url("${game.imageCoverPath}")`};
        filter: blur(8px);
        transform: scale(1.02);
        // scale fixes the 5px of transparent border from the blur
    }
`;

function GameCard({game, onClick}) {
    const handleDrop = (e) => {
        const item = e.dataTransfer.getData('item');
        const dataType = e.dataTransfer.getData('dataType');
        switch (dataType) {
            case 'friend':
                game.addFriend(item);
                break;
            case 'category':
                game.addCategory(item);
                break;
            default:
                console.error("Drag Issue: not a friend or a category");
        }
    }
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
                alt={game.title + " Game Cover"}
                onError={(e) => {
                    e.target.src = "/cards/missing_image.png"
                }}
            />
        </button>
    );
}

GameCard.propTypes = {
    game: PropTypes.instanceOf(GameObject).isRequired,
    onClick: PropTypes.func.isRequired,
}

function ModalListButton({value, dataType, handleRemove}) {
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

ModalListButton.propTypes = {
    value: PropTypes.string.isRequired,
    dataType: PropTypes.string.isRequired,
    handleRemove: PropTypes.func.isRequired,
}

function ListAndAdder({game, dataType}) {
    const [cardTitle, innerList, fullList, addItem, removeItem] = dataType === 'friend'
        ? ['Friends', game.friends, allFriends, game.addFriend.bind(game), game.removeFriend.bind(game)]
        : ['Categories', game.categories, allCategories, game.addCategory.bind(game), game.removeCategory.bind(game)];
    // TODO: Refactor, probably remake GameObject
    const [list, setList] = useState([...innerList])
    const updateList = () => setList([...innerList])
    const handleAdderChange = (e) => {
        addItem(e.target.value)
        updateList()
    }
    const handleRemove = (item) => {
        removeItem(item)
        updateList()
    }
    useEffect(updateList, [innerList])

    return (
        <div className="sidebar">
            <div className="sidebar-card" style={{background: "none", maxHeight: "none"}}>
                <p className="sidebar-title"
                   style={{color: "#fff", textAlign: "left", padding: "5px 10px"}}>{cardTitle}</p>
                <div key={"innerList" + innerList.length} className="sidebar-buttons-list">
                    {list.map((data, index) =>
                        (<ModalListButton
                            key={`btn-modal-${dataType}-${index}`}
                            value={data}
                            dataType={dataType}
                            handleRemove={handleRemove}
                        />)
                    )}

                    <Form.Select onChange={handleAdderChange}>
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

ListAndAdder.propTypes = {
    game: PropTypes.instanceOf(GameObject).isRequired,
    dataType: PropTypes.string.isRequired,
}

function GameModal({game, show, handleHide}) {
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
                        width: "100%",
                    }}
                >
                    {game.title}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{display: "flex", flexDirection: "row", padding: 0}}>
                <ListAndAdder game={game} dataType="friend"></ListAndAdder>
                <ListAndAdder game={game} dataType="category"></ListAndAdder>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={handleHide}>
                    Save
                </Button>
            </Modal.Footer>
        </ModalCard>
    )
}

GameModal.propTypes = {
    game: PropTypes.instanceOf(GameObject).isRequired,
    show: PropTypes.bool.isRequired,
    handleHide: PropTypes.func.isRequired,
}

export function GamesGrid({filteredGames}) {
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
                {filteredGames.map((game) => (<GameCard
                    key={"gamegrid-card-" + game.title}
                    game={game}
                    onClick={handleShowModal}/>))}
                <GameModal game={modalGame} show={showModal} handleHide={handleHideModal}/>
            </div>
        </div>
    );
}

GamesGrid.propTypes = {
    filteredGames: PropTypes.array.isRequired,
}
