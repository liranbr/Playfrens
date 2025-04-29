import Modal from "react-bootstrap/Modal";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import { addData, editData } from "../Store.jsx";

export function EditDataModal({ show, setShow, dataType, editedDataName = "" }) {
    const title = (editedDataName ? "Edit " : "Add ") + dataType.single;
    const handleClose = () => setShow(false);
    const handleSave = () => {
        const dataName = document.getElementById("dataNameInput").value;
        const doneFunction = editedDataName ?
            editData(dataType, editedDataName, dataName) :
            addData(dataType, dataName);
        if (doneFunction)
            setShow(false);
    };
    return (
        <Modal show={show} onHide={handleClose} size={"sm"} centered>
            <Modal.Header closeButton>
                <h4 style={{ margin: 0, color: "#dee2e6" }}>{title}</h4>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <p style={{ color: "#dee2e6" }}>Name</p>
                    <Form.Group className="mb-3" controlId="dataNameInput">
                        <Form.Control
                            type="text"
                            defaultValue={editedDataName}
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