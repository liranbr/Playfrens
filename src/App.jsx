import "./App.css";
import { GamesGrid } from "./GameGrid.jsx";
import {
    Button,
    Col,
    Container,
    Form,
    Nav,
    Navbar,
    NavDropdown,
    Row,
    ToggleButton,
} from "react-bootstrap";
import { useState } from "react";

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
                <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                    <NavDropdown.Item href="#action/3.1">
                        Action
                    </NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.2">
                        Another action
                    </NavDropdown.Item>
                    <NavDropdown.Item href="#action/3.3">
                        Something
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item href="#action/3.4">
                        Separated link
                    </NavDropdown.Item>
                </NavDropdown>
            </Nav>
            <Form inline className="d-flex">
                <Form.Control
                    type="text"
                    placeholder="Search"
                    className="me-2"
                    style={{ backgroundColor: "#1e1f22" }}
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
            type="checkbox"
            className="btn-sidebar"
            checked={checked}
            onChange={(e) => setChecked(e.currentTarget.checked)}
        >
            {label}
        </ToggleButton>
    );
}

function SidebarContent() {
    const friends = [
        "Sami",
        "Nibbix",
        "RocketDN",
        "MindHawk",
        "VX",
        "Cake",
        "Labreris",
        "Gooey",
    ];
    const categories = [
        "Playthroughs",
        "Round-based",
        "Plan To Play",
        "Later",
        "Finished",
    ];
    return (
        <>
            <Row className="h-50 align-content-start p-3" >
                <p className="sidebar-title">FRIENDS</p>
                {friends.map((friend) =>
                    SidebarButton(
                        "btn-sidebar-friend-" + friends.indexOf(friend),
                        friend,
                        friend,
                    ),
                )}
            </Row>
            <Row className="h-50 align-content-start p-3">
                <p className="sidebar-title">CATEGORIES</p>
                {categories.map((category) =>
                    SidebarButton(
                        "btn-sidebar-category-" + categories.indexOf(category),
                        category,
                        category,
                    ),
                )}
            </Row>
        </>
    );
}

function ContentBody() {
    return (
        <Container fluid className="content-body">
            <div className="d-flex flex-row h-100">
                <div className="sidebar">
                    <SidebarContent/>
                </div>
                <div>
                    <GamesGrid/>
                </div>
            </div>
        </Container>
    );
}

export default function App() {
    return (
        <>
            <Header />
            <ContentBody />
        </>
    );
}
