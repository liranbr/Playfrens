import { useMemo, useState } from "react";
import Navbar from "react-bootstrap/Navbar";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { ToastContainer } from "react-toastify";
import { MdClose, MdOutlineFileDownload, MdOutlineFileUpload } from "react-icons/md";
import { addData, allGames, editData, loadDataFromFile, saveDataToFile } from "./Store.jsx";
import { dataTypes } from "./models/DataTypes.jsx";
import { GamesGrid } from "./components/GameGrid.jsx";
import { setForceFilterUpdateCallback } from "./Utils.jsx";
import { SidebarGroup } from "./components/Components.jsx";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";

function AppHeader({ searchState }) {
    const [search, setSearch] = searchState;
    const updateSearch = (e) => setSearch(e.target.value || "");
    return (
        <Navbar className="app-header" fixed="top">
            <Navbar.Brand>
                <img
                    src="/Playfrens_Logo.png"
                    alt="Playfrens Logo"
                    width={30}
                    height={30}
                    className="d-inline-block align-top"
                />
                <b> Playfrens</b>
            </Navbar.Brand>
            <input
                type="file"
                id="json-selector"
                accept=".json"
                style={{ display: "none" }}
                onChange={(e) => loadDataFromFile(e.target.files[0])}
            />
            <Nav className="me-auto">
                <NavDropdown draggable="false" title="File">
                    <NavDropdown.Item draggable="false" onClick={() => {
                        document.getElementById("json-selector").click();
                    }}>
                        <MdOutlineFileUpload className="dropdown-item-icon" />
                        Import Data</NavDropdown.Item>
                    <NavDropdown.Item draggable="false" onClick={saveDataToFile}>
                        <MdOutlineFileDownload className="dropdown-item-icon" />
                        Export Data</NavDropdown.Item>
                </NavDropdown>
                <Nav.Link draggable="false" href="https://github.com/liranbr/Playfrens">GitHub</Nav.Link>
            </Nav>
            <Form inline="true" className="d-flex">
                <Form.Control
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={updateSearch}
                    style={{ background: "none" }}
                    onKeyDown={(e) => e.key === "Enter" ? e.preventDefault() : null}
                    onSubmit={(e) => e.preventDefault()}
                />
                <button type="reset" className="icon-button" onClick={updateSearch} style={{
                    display: search ? "flex" : "none",
                    position: "absolute",
                    fontSize: "20px",
                    right: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "none",
                    alignItems: "center"
                }}>
                    <MdClose />
                </button>
            </Form>
        </Navbar>
    );
}

function SidebarModal({ show, setShow, dataType, editedDataName = "" }) {
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

// TODO: Avoid prop drilling, especially for editedDataName in the modal. useContext?
function AppSidebar({ setSelectedFriends, setSelectedCategories, setSelectedStatuses }) {
    const [showModal, setShowModal] = useState(false);
    const [editedDataName, setEditedDataName] = useState("");
    const [modalDataType, setModalDataType] = useState(dataTypes.friend);
    const handleShowModal = (dataType, dataName = "") => {
        setEditedDataName(dataName);
        setModalDataType(dataType);
        setShowModal(true);
    };
    // 50% height for friend bar, 50% for categories and statuses
    return (
        <div className="app-sidebar">
            <SidebarModal
                dataType={modalDataType}
                show={showModal}
                setShow={setShowModal}
                editedDataName={editedDataName} />
            <SidebarGroup
                dataType={dataTypes.friend}
                dataList={dataTypes.friend.allDataList}
                setSelection={setSelectedFriends}
                handleShowModal={handleShowModal} />
            <div className="sidebar-subgroup">
                <SidebarGroup
                    dataType={dataTypes.category}
                    dataList={dataTypes.category.allDataList}
                    setSelection={setSelectedCategories}
                    handleShowModal={handleShowModal} />
                <SidebarGroup
                    dataType={dataTypes.status}
                    dataList={dataTypes.status.allDataList}
                    setSelection={setSelectedStatuses}
                    handleShowModal={handleShowModal} />
            </div>
        </div>
    );
}

export default function App() {
    const [search, setSearch] = useState("");
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [forceFilterUpdate, setForceFilterUpdate] = useState(0);
    setForceFilterUpdateCallback(() => {
        setForceFilterUpdate(prev => prev + 1); // used in Utils to trigger a filter update
    });

    // Game Title includes the search value
    // If friends selected, all friends are in the game
    // If categories selected, game belongs to at least one of them
    // If statuses selected, game has at least one of them
    const filteredGames = useMemo(() =>
            allGames.filter((game) =>
                game.title.toLowerCase().includes(search.toLowerCase()) &&
                selectedFriends.every(friend => game.friends.includes(friend)) &&
                (!selectedCategories.length || selectedCategories.some(category => game.categories.includes(category))) &&
                (!selectedStatuses.length || selectedStatuses.some(status => game.statuses.includes(status)))
            )
        , [search, selectedFriends, selectedCategories, selectedStatuses, forceFilterUpdate]);

    return (
        <>
            <AppHeader searchState={[search, setSearch]} />
            <div id="main-content">
                <AppSidebar setSelectedFriends={setSelectedFriends}
                            setSelectedCategories={setSelectedCategories}
                            setSelectedStatuses={setSelectedStatuses} />
                <GamesGrid filteredGames={filteredGames} />
            </div>
            <ToastContainer />
        </>
    );
};