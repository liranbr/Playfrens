import "./App.css";
import "./GameGrid.css";
import {Button, Modal, Form, OverlayTrigger, Tooltip} from "react-bootstrap";
import {useState} from "react";
import styled from "styled-components";
import {GameObject, allFriends, allCategories} from "./Store.jsx";
import PropTypes from "prop-types";
import {SidebarButton} from "./App.jsx";


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

function ModalListButton({id, value, label, dataType, removeItem, handleDragStart}) {
    const handleDrag = (e) => {
        handleDragStart(e, value, dataType)
    }
    const handleClick = (e) => {
        removeItem(value);
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

function ListAndAdder({title, dataType, innerList, fullList}) {
    const cardTitle = dataType === 'friend' ? 'Friends' : 'Categories';
    const [list, setList] = useState(innerList);
    const [adderValue, setAdderValue] = useState("");
    const handleAdderChange = (e) => {
        setAdderValue(""); // reset the adder to 'Add...'
        setList(prevList => [...prevList, e.target.value]);
        innerList.push(e.target.value);
    };
    const handleDragStart = () => {
    };
    const removeItem = (item) => {
        setList(prevList => prevList.filter(i => i !== item));
        innerList.splice(innerList.indexOf(item), 1);
    }


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
                            removeItem={removeItem}
                            handleDragStart={handleDragStart}
                        />)
                    )}

                    <Form.Select value={adderValue} onChange={handleAdderChange}>
                        <option value="" hidden>Add...</option>
                        {fullList.filter(item => !list.includes(item))
                            .map((item, index) => (
                                <option key={title + "-" + dataType + "-option-" + index} value={item}>{item}</option>
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
                        <ListAndAdder title={modalGame.title} dataType="friend" fullList={allFriends}
                                      innerList={modalGame.friends}></ListAndAdder>
                        <ListAndAdder title={modalGame.title} dataType="category" fullList={allCategories}
                                      innerList={modalGame.categories}></ListAndAdder>
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
