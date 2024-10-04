import "./App.css";
import {GamesGrid} from "./GameGrid.jsx";
import {Button, Container, Form, Nav, Navbar, NavDropdown, Row, ToggleButton} from "react-bootstrap";
import {useMemo, useState} from "react";
import {allCategories, allFriends, allGames} from "./Store.jsx"
import PropTypes from "prop-types";

function Header({setSearchOuter}) {
    const [search, setSearch] = useState("")
    const handleSearchChange = (event) => {
        setSearch(event.target.value); // value of searchbar, used for search reset button behavior
        setSearchOuter(event.target.value); // sends up the value for filtering
        // TODO: Improve implementation
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
                    value={search}
                    onChange={handleSearchChange}
                    style={{background: "none"}}
                />
                <Button variant="outline-secondary" type="reset" onClick={handleSearchChange}
                        style={{
                            display: search ? 'block' : 'none',
                            position: "absolute",
                            right: "16px",
                            border: "none",
                            background: "none"
                        }}>x</Button>
            </Form>
        </Navbar>
    );
}

Header.propTypes = {
    setSearchOuter: PropTypes.func.isRequired,
}

function SidebarButton({id, value, label, dataType, setSelection, handleDragStart}) {
    // TODO: Too many props? improve implementation
    const [checked, setChecked] = useState(false);
    const handleChange = (e) => {
        const isChecked = e.currentTarget.checked;
        setChecked(isChecked); // set button state
        setSelection(prevSelection => {
            return isChecked
                ? [...prevSelection, value] // select filter
                : prevSelection.filter(item => item !== value); // deselect filter
        })
    }
    const handleDrag = (e) => {
        handleDragStart(e, value, dataType)
    }

    return (
        <ToggleButton
            id={id}
            value={value}
            className="sidebar-button"
            type="checkbox"
            datatype={dataType}
            checked={checked}
            draggable="true"
            onDragStart={handleDrag}
            onChange={handleChange}
        >
            {label}
        </ToggleButton>
    );
}

SidebarButton.propTypes = {
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    dataType: PropTypes.string.isRequired,
    setSelection: PropTypes.func.isRequired,
    handleDragStart: PropTypes.func.isRequired,
}

function Sidebar({setSelectedFriends, setSelectedCategories, handleDragStart}) {
    return (
        <div className="sidebar">
            <Row className="sidebar-card" style={{marginBottom: "5px"}}>
                <p className="sidebar-title">CATEGORIES</p>
                <div className="sidebar-buttons-list">
                    {[...allCategories].map((category, index) =>
                        (<SidebarButton
                            key={"btn-sidebar-category-" + index}
                            id={"btn-sidebar-category-" + index}
                            value={category}
                            label={category}
                            dataType={'category'}
                            setSelection={setSelectedCategories}
                            handleDragStart={handleDragStart}
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
                            dataType={'friend'}
                            setSelection={setSelectedFriends}
                            handleDragStart={handleDragStart}
                        />)
                    )}
                </div>
            </Row>
        </div>
    );
}

Sidebar.propTypes = {
    setSelectedFriends: PropTypes.func.isRequired,
    setSelectedCategories: PropTypes.func.isRequired,
    handleDragStart: PropTypes.func.isRequired,
}

export default function App() {
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [search, setSearch] = useState("");
    const filteredGames = useMemo(() => {
        return allGames.filter((game) => {
            return game.title.toLowerCase().includes(search.toLowerCase()) && // Game Title includes the search value
                selectedFriends.every(selectedFriend => game.friends.includes(selectedFriend)) && // All friends are in the game
                (!selectedCategories.length || // No categories selected, or
                    selectedCategories.some(selectedCategory => game.categories.includes(selectedCategory))); // Game belongs to at least one category
        })
    }, [search, selectedFriends, selectedCategories]);

    const handleDragStart = (e, item, dataType) => {
        e.dataTransfer.setData('item', item);
        e.dataTransfer.setData('dataType', dataType);
    }

    return (
        <>
            <Header setSearchOuter={setSearch}/>
            <Container fluid className="content-body">
                <div className="d-flex flex-row h-100">
                    <Sidebar setSelectedCategories={setSelectedCategories}
                             setSelectedFriends={setSelectedFriends}
                             handleDragStart={handleDragStart}
                    />
                    <GamesGrid filteredGames={filteredGames}/>
                </div>
            </Container>
        </>
    );
}
