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
        if (game) {
            if (game.editGame(gameTitle, gameCoverPath))
                handleClose();
        } else {
            if (addGame(gameTitle, gameCoverPath))
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
                    <p style={{ color: "#dee2e6" }}>Game Title</p>
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
                    <p style={{ color: "#dee2e6" }}>Game Cover URL</p>
                    <Form.Group className="mb-3" controlId="gameCoverInput">
                        <Form.Control
                            type="text"
                            defaultValue={game ? game.coverImagePath : ""}
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