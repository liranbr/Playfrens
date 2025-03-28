import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import { Button, Container, Form, Nav, Navbar, NavDropdown, Row, ToggleButton } from "react-bootstrap";
import { ToastContainer } from "react-toastify";
import { useMemo, useState } from "react";
import { GamesGrid } from "./GameGrid.jsx";
import { allCategories, allFriends, allGames, loadDataFromFile, saveDataToFile } from "./Store.jsx";

function Header({ searchState }) {
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

export function SidebarButton({ value, dataType, setSelection }) {
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
            id={"btn-sidebar-" + dataType + "-" + value}
            value={value}
            className="sidebar-button"
            type="checkbox"
            checked={checked}
            draggable="true"
            onChange={handleChange}
            onDragStart={(e) => {
                e.dataTransfer.setData("item", value);
                e.dataTransfer.setData("dataType", dataType);
            }}
        >
            {value}
        </ToggleButton>
    );
}

function SidebarCard({ dataType, setSelection }) {
    const [title, fullList] = dataType === "friend"
        ? ["FRIENDS", allFriends]
        : ["CATEGORIES", allCategories];
    return (
        <Row className="sidebar-card">
            <p className="sidebar-title">{title}</p>
            <div className="sidebar-buttons-list">
                {fullList.map((item, index) =>
                    <SidebarButton
                        key={index}
                        value={item}
                        dataType={dataType}
                        setSelection={setSelection}
                    />
                )}
            </div>
        </Row>
    );
}

export default function App() {
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const searchState = useState("");
    const search = searchState[0];
    const filteredGames = useMemo(() =>
            allGames.filter((game) =>
                game.title.toLowerCase().includes(search.toLowerCase()) && // Game Title includes the search value
                selectedFriends.every(selectedFriend => game.friends.includes(selectedFriend)) && // All friends are in the game
                (!selectedCategories.length || // No categories selected, or
                    selectedCategories.some(selectedCategory => game.categories.includes(selectedCategory))) // Game belongs to at least one category
            )
        , [search, selectedFriends, selectedCategories]);

    return (
        <>
            <Header searchState={searchState} />
            <Container fluid className="content-body">
                <div className="d-flex flex-row h-100">
                    <div className="sidebar">
                        <SidebarCard dataType="category" setSelection={setSelectedCategories} />
                        <SidebarCard dataType="friend" setSelection={setSelectedFriends} />
                    </div>
                    <GamesGrid filteredGames={filteredGames} />
                </div>
            </Container>
            <ToastContainer />
        </>
    );
};