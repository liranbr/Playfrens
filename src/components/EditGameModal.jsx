import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { addGame } from "../Store.jsx";

export function EditGameModal({ show, setShow, game = null, setShowCardModal = null }) {
    const handleClose = () => {
        setShow(false);
        if (setShowCardModal) {
            setShowCardModal(true);
        }
    };
    const handleSave = () => {
        const gameTitle = document.getElementById("gameTitleInput").value;
        const gameCoverPath = document.getElementById("gameCoverInput").value;
        const gameSortingTitle = document.getElementById("gameSortingTitleInput").value;
        if (game) {
            if (game.editGame(gameTitle, gameCoverPath, gameSortingTitle))
                handleClose();
        } else {
            if (addGame(gameTitle, gameCoverPath, gameSortingTitle))
                handleClose();
        }
    };
    return (
        <Modal show={show} onHide={handleClose} size={"sm"} centered>
            <Modal.Header closeButton>
                <h4 style={{ margin: 0, color: "#dee2e6" }}>{game ? "Edit Game" : "Add Game"}</h4>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <p style={{ color: "#dee2e6", marginBottom: "5px" }}>Game Title</p>
                    <Form.Group className="mb-3" controlId="gameTitleInput">
                        <Form.Control
                            type="text"
                            defaultValue={game ? game.title : ""}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSave();
                                    return e.preventDefault();
                                }
                                return null;
                            }}
                        />
                    </Form.Group>
                    <p style={{ color: "#dee2e6", marginBottom: "5px" }}>Game Cover URL</p>
                    <Form.Group controlId="gameCoverInput">
                        <Form.Control
                            type="text"
                            defaultValue={game ? game.coverImageURL : ""}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSave();
                                    return e.preventDefault();
                                }
                                return null;
                            }}
                        />
                    </Form.Group>
                    <p style={{ color: "#dee2e6", fontSize: "14px" }}>
                        <a href="https://www.steamgriddb.com/" target="_blank"
                           rel="noopener noreferrer">SteamGridDB</a> (ideally 600x900)
                    </p>
                    <p style={{ color: "#dee2e6", marginBottom: "5px" }}>Sorting Title (optional)</p>
                    <Form.Group className="mb-3" controlId="gameSortingTitleInput">
                        <Form.Control
                            type="text"
                            defaultValue={game ? game.sortingTitle : ""}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    handleSave();
                                    return e.preventDefault();
                                }
                                return null;
                            }}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleSave}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>
    );
}