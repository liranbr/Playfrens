import { useMemo, useState } from "react";
import Navbar from "react-bootstrap/Navbar";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import { ToastContainer } from "react-toastify";
import { MdClose, MdOutlineFileDownload, MdOutlineFileUpload, MdOutlineGamepad } from "react-icons/md";
import { allGames, backupToFile, restoreFromFile } from "./Store.jsx";
import { dataTypes } from "./models/DataTypes.jsx";
import { GamesGrid } from "./components/GameGrid.jsx";
import { setForceFilterUpdateCallback } from "./Utils.jsx";
import { SidebarGroup } from "./components/SidebarGroup.jsx";
import { EditGameModal } from "./components/EditGameModal.jsx";
import { EditDataModal } from "./components/EditDataModal.jsx";
import { ModalRoot } from "./components/Modals/ModalRoot.jsx";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

function AppHeader({ searchState }) {
    const [search, setSearch] = searchState;
    const [showGameModal, setShowGameModal] = useState(false);
    const updateSearch = (e) => setSearch(e.target.value || "");
    return (
        <Navbar className="app-header">
            <Form inline="true" style={{
                position: "absolute",
                right: "50%",
                transform: "translateX(50%)"
            }}>
                <Form.Control
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={updateSearch}
                    style={{
                        background: "none",
                        borderRadius: "15px",
                        ...(search && { border: "2px solid royalblue" }),
                        height: "36px",
                        width: "300px",
                        boxSizing: "border-box"
                    }}
                    onKeyDown={(e) => e.key === "Enter" ? e.preventDefault() : null}
                    onSubmit={(e) => e.preventDefault()}
                />
                <button type="reset" className="icon-button" onClick={updateSearch} style={{
                    display: search ? "flex" : "none",
                    position: "absolute",
                    fontSize: "20px",
                    right: "0",
                    top: "50%",
                    transform: "translateY(-50%)",
                    border: "none",
                    background: "none",
                    alignItems: "center"
                }}>
                    <MdClose />
                </button>
            </Form>
            <EditGameModal show={showGameModal} setShow={setShowGameModal} />
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
                onChange={(e) => restoreFromFile(e.target.files[0])}
            />
            <Nav className="me-auto">
                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <span className="dropdown-toggle nav-link">File</span>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content className="rx-dropdown-menu" align={"start"} side={"bottom"} sideOffset={5}>
                        <DropdownMenu.Item onClick={() => {
                            document.getElementById("json-selector").click();
                        }}>
                            <MdOutlineFileUpload /> Restore
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onClick={backupToFile}>
                            <MdOutlineFileDownload /> Backup
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Root>

                <Nav.Link draggable="false" href="https://github.com/liranbr/Playfrens" target="_blank"
                          rel="noopener noreferrer">GitHub</Nav.Link>
            </Nav>
            <button className="new-game-button" onClick={() => setShowGameModal(true)}>
                <MdOutlineGamepad />
            </button>
        </Navbar>
    );
}

// TODO: Avoid prop drilling, especially for editedDataName in the modal. useContext?
function AppSidebar({ setSelectedFriends, setSelectedCategories, setSelectedStatuses }) {
    const [showDataModal, setShowDataModal] = useState(false);
    const [editedDataName, setEditedDataName] = useState("");
    const [modalDataType, setModalDataType] = useState(dataTypes.friend);
    const handleShowModal = (dataType, dataName = "") => {
        setEditedDataName(dataName);
        setModalDataType(dataType);
        setShowDataModal(true);
    };
    // 50% height for friend bar, 50% for categories and statuses
    return (
        <div className="app-sidebar">
            <EditDataModal
                dataType={modalDataType}
                show={showDataModal}
                setShow={setShowDataModal}
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
            <ModalRoot />
            <ToastContainer toastClassName="toast-notification" />
        </>
    );
};