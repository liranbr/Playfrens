import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "react-bootstrap/Navbar";
import Form from "react-bootstrap/Form";
import Nav from "react-bootstrap/Nav";
import NavDropdown from "react-bootstrap/NavDropdown";
import { ToastContainer } from "react-toastify";
import { useMemo, useState } from "react";
import { GamesGrid } from "./components/GameGrid.jsx";
import { allGames, loadDataFromFile, saveDataToFile } from "./Store.jsx";
import { dataTypes } from "./models/DataTypes.jsx";
import { SidebarGroup } from "./components/Components.jsx";
import { setForceFilterUpdateCallback } from "./Utils.jsx";
import { MdClose } from "react-icons/md";

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
                {/* temp links for dev */}
                <NavDropdown title="File" id="basic-nav-dropdown">
                    <NavDropdown.Item onClick={() => {
                        document.getElementById("json-selector").click();
                    }}>
                        Import Data</NavDropdown.Item>
                    <NavDropdown.Item onClick={saveDataToFile}>
                        Export Data</NavDropdown.Item>
                </NavDropdown>
                <Nav.Link href="https://trello.com/b/H9Cln6UD/playfrens">Kanban</Nav.Link>
                <Nav.Link href="https://github.com/liranbr/Playfrens">GitHub</Nav.Link>
                <Nav.Link href="https://react-bootstrap.netlify.app/docs/components/cards">Bootstrap</Nav.Link>
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

function AppSidebar({ selectionSetters: { friendSelection, categorySelection, statusSelection } }) {
    // 50% height to friend bar, 50% to categories + status
    return (
        <div className="app-sidebar">
            <SidebarGroup
                dataType={dataTypes.friend}
                dataList={dataTypes.friend.allDataList}
                setSelection={friendSelection} />
            <div className="sidebar-subgroup">
                <SidebarGroup
                    dataType={dataTypes.category}
                    dataList={dataTypes.category.allDataList}
                    setSelection={categorySelection} />
                <SidebarGroup
                    dataType={dataTypes.status}
                    dataList={dataTypes.status.allDataList}
                    setSelection={statusSelection} />
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
                <AppSidebar selectionSetters={[setSelectedFriends, setSelectedCategories, setSelectedStatuses]} />
                <GamesGrid filteredGames={filteredGames} />
            </div>
            <ToastContainer />
        </>
    );
};