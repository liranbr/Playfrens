import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import { Button, Form, Nav, Navbar, NavDropdown, Row, ToggleButton } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import { useMemo, useState } from "react";
import { GamesGrid } from "./GameGrid.jsx";
import { allGames, loadDataFromFile, saveDataToFile } from "./Store.jsx";
import { dataTypes } from "./dataTypes.jsx";

function AppHeader({ searchState }) {
    const [search, setSearch] = searchState;
    const updateSearch = (e) => setSearch(e.target.value);

    return (
        <Navbar className="px-3" fixed="top" style={{ backgroundColor: "#1e1f22" }}>
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
            <Nav className="me-auto">
                {/* temp links for dev */}
                <NavDropdown title="File" id="basic-nav-dropdown">
                    <NavDropdown.Item onClick={() => document.getElementById("file-selector").click()}>
                        Import Data</NavDropdown.Item>
                    <NavDropdown.Item onClick={saveDataToFile}>Export Data</NavDropdown.Item>
                </NavDropdown>
                <Nav.Link href="https://trello.com/b/H9Cln6UD/playfrens">Kanban</Nav.Link>
                <Nav.Link href="https://github.com/liranbr/Playfrens">GitHub</Nav.Link>
                <Nav.Link href="https://react-bootstrap.netlify.app/docs/components/cards">Bootstrap</Nav.Link>
            </Nav>
            <input
                type="file"
                id="file-selector"
                style={{ display: "none" }}
                onChange={(e) => loadDataFromFile(e.target.files[0])}
            />
            <Form inline="true" className="d-flex">
                <Form.Control
                    type="text"
                    placeholder="Search"
                    value={search}
                    onChange={updateSearch}
                    style={{ background: "none" }}
                />
                <Button variant="outline-secondary" type="reset" onClick={updateSearch}
                        style={{
                            display: search ? "block" : "none",
                            position: "absolute",
                            right: "16px",
                            border: "none",
                            background: "none"
                        }}>x</Button>
            </Form>
        </Navbar>
    );
}

export function SidebarButton({ value, dataTypeKey, setSelection }) {
    const [checked, setChecked] = useState(false);
    const handleChange = (e) => {
        const isChecked = e.currentTarget.checked;
        setChecked(isChecked); // set button state
        setSelection(prevSelection => {
            return isChecked
                ? [...prevSelection, value] // select filter
                : prevSelection.filter(item => item !== value); // deselect filter
        });
    };

    return (
        <ToggleButton
            id={"btn-sidebar-" + dataTypeKey + "-" + value}
            value={value}
            className="sidebar-button"
            type="checkbox"
            checked={checked}
            draggable="true"
            onChange={handleChange}
            onDragStart={(e) => {
                e.dataTransfer.setData("item", value);
                e.dataTransfer.setData("dataTypeKey", dataTypeKey);
            }}
        >
            {value}
        </ToggleButton>
    );
}

function SidebarGroup({ dataType, setSelection }) {
    const title = dataType.plural.toUpperCase();
    const allDataList = dataType.allDataList;
    return (
        <Row className="sidebar-group">
            <p className="sidebar-title">{title}</p>
            <div className="sidebar-buttons-list">
                {allDataList.map((item, index) =>
                    <SidebarButton
                        key={index}
                        value={item}
                        dataTypeKey={dataType.key}
                        setSelection={setSelection}
                    />
                )}
            </div>
        </Row>
    );
}

function Sidebar(props) {
    const { dataTypes, selectionSetters } = props;
    return (
        <div className="sidebar">
            {dataTypes.map((dataType, index) =>
                <SidebarGroup key={dataType.single} dataType={dataType} setSelection={selectionSetters[index]} />)}
        </div>
    );
}

export default function App() {
    const [search, setSearch] = useState("");
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);

    const filteredGames = useMemo(() =>
            allGames.filter((game) =>
                // Game Title includes the search value
                game.title.toLowerCase().includes(search.toLowerCase()) &&
                // All selected friends are in the game
                selectedFriends.every(friend => game.friends.includes(friend)) &&
                // No categories selected, or game belongs to at least one selected category
                (!selectedCategories.length || selectedCategories.some(category => game.categories.includes(category))) &&
                // No statuses selected, or game has at least one selected status
                (!selectedStatuses.length || selectedStatuses.some(status => game.statuses.includes(status)))
            )
        , [search, selectedFriends, selectedCategories, selectedStatuses]);

    return (
        <>
            <AppHeader searchState={[search, setSearch]} />
            <div id="main-content">
                <Sidebar dataTypes={[dataTypes.friend, dataTypes.category, dataTypes.status]}
                         selectionSetters={[setSelectedFriends, setSelectedCategories, setSelectedStatuses]} />
                <GamesGrid filteredGames={filteredGames} />
            </div>
            <ToastContainer />
        </>
    );
};