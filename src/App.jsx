import "./App.css";
import {GamesGrid} from "./GameGrid.jsx";
import {Button, Container, Form, Nav, Navbar, NavDropdown, Row, ToggleButton,} from "react-bootstrap";
import {useMemo, useState} from "react";
import {allCategories, allFriends, allGames} from "./Store.jsx"
import PropTypes from "prop-types";

function Header({setSearch}) {
    const handleSearchChange = (event) => {
        setSearch(event.target.value);
    }

    return (
        <Navbar className="px-3" fixed="top" style={{backgroundColor: "#1e1f22"}}>
            <Navbar.Brand>
                <img
                    src="/Playfrens_Logo.png"
                    alt="Playfrens Logo"
                    width={30}
                    height={30}
                    className="d-inline-block align-top"
                />{" "}
                Playfrens
            </Navbar.Brand>
            <Nav className="me-auto">
                {/* temp links for dev */}
                <Nav.Link href="https://trello.com/b/H9Cln6UD/playfrens">Kanban</Nav.Link>
                <Nav.Link href="https://github.com/liranbr/Playfrens">GitHub</Nav.Link>
                <Nav.Link href="https://react-bootstrap.netlify.app/docs/components/cards">Bootstrap</Nav.Link>
                <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                    <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                    <NavDropdown.Divider/>
                    <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
                </NavDropdown>
            </Nav>
            <Form inline="true" className="d-flex">
                <Form.Control
                    type="text"
                    placeholder="Search"
                    className="me-2"
                    onChange={handleSearchChange}
                    style={{backgroundColor: "#1e1f22"}}
                />
            </Form>
        </Navbar>
    );
}

function SidebarButton({id, value, label}) {
    const [checked, setChecked] = useState(false);
    return (
        <ToggleButton
            id={id}
            value={value}
            className="sidebar-button"
            type="checkbox"
            checked={checked}
            draggable="true"
            onChange={(e) => setChecked(e.currentTarget.checked)}
        >
            {label}
        </ToggleButton>
    );
}

SidebarButton.propTypes = {
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
}

function Sidebar() {
    return (
        <div className="sidebar">
            <Row className="sidebar-card" style={{marginBottom: "5px"}}>
                <p className="sidebar-title">CATEGORIES</p>
                <div className="sidebar-buttons-list">
                    {allCategories.map((category, index) =>
                        (<SidebarButton
                            key={"btn-sidebar-category-" + index}
                            id={"btn-sidebar-category-" + index}
                            value={category}
                            label={category}
                        />)
                    )}
                </div>
            </Row>
            <Row className="sidebar-card" style={{marginTop: "5px"}}>
                <p className="sidebar-title">FRIENDS</p>
                <div className="sidebar-buttons-list">
                    {allFriends.map((friend, index) =>
                        (<SidebarButton
                            key={"btn-sidebar-friend-" + index}
                            id={"btn-sidebar-friend-" + index}
                            value={friend}
                            label={friend}
                        />)
                    )}
                </div>
            </Row>
        </div>
    );
}

export default function App() {
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [search, setSearch] = useState("");

    const filteredGames = useMemo(() => {
        if (search === "") return allGames;
        return allGames.filter((game) => {
            return game.title.toLowerCase().includes(search.toLowerCase())
        })
    }, [search]);

    return (
        <>
            <Header setSearch={setSearch}/>
            <Container fluid className="content-body">
                <div className="d-flex flex-row h-100">
                    <Sidebar setSelectedFriends={setSelectedFriends} setSelectedCategories={setSelectedCategories}/>
                    <GamesGrid filteredGames={filteredGames}/>
                </div>
            </Container>
        </>
    );
}
