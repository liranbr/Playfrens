import "./App.css";
import {GamesGrid} from "./GameGrid.jsx";
import {
    Button,
    Container,
    Form,
    Nav,
    Navbar,
    NavDropdown,
    Row,
    ToggleButton,
} from "react-bootstrap";
import {useState} from "react";

function Header() {
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
            <Form inline className="d-flex">
                <Form.Control
                    type="text"
                    placeholder="Search"
                    className="me-2"
                    style={{backgroundColor: "#1e1f22"}}
                />
                <Button type="submit">Submit</Button>
            </Form>
        </Navbar>
    );
}

function SidebarButton(id, value, label) {
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

function Sidebar() {
    const friends = [
        "Sami",
        "Nibbix",
        "RocketDN",
        "MindHawk",
        "VX",
        "Cake",
        "Labreris",
        "Gooey",
        "shinn",
        "Bram",
        "wesje101",
        "Twinkle",
        "Vented",
        "MechArcana",
        "Tristan",
        "Xianji",
        "Sky",
        "Niv",
        "Aco"
    ];
    const categories = [
        "Playthroughs",
        "Round-based",
        "Plan To Play",
        "Later",
        "Finished"
    ];
    return (
        <div className="sidebar">
            <Row className="sidebar-card" style={{marginBottom: "5px"}}>
                <p className="sidebar-title">CATEGORIES</p>
                <div className="sidebar-buttons-list">
                    {categories.map((category) =>
                        SidebarButton(
                            "btn-sidebar-category-" + categories.indexOf(category),
                            category,
                            category,
                        ),
                    )}
                </div>
            </Row>
            <Row className="sidebar-card" style={{marginTop: "5px"}}>
                <p className="sidebar-title">FRIENDS</p>
                <div className="sidebar-buttons-list">
                    {friends.map((friend) =>
                        SidebarButton(
                            "btn-sidebar-friend-" + friends.indexOf(friend),
                            friend,
                            friend,
                        ),
                    )}
                </div>
            </Row>
        </div>
    );
}

function ContentBody() {
    return (
        <Container fluid className="content-body">
            <div className="d-flex flex-row h-100">
                <Sidebar/>
                <GamesGrid/>
            </div>
        </Container>
    );
}

export default function App() {
    return (
        <>
            <Header/>
            <ContentBody/>
        </>
    );
}
