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
    ToggleButtonGroup,
} from "react-bootstrap";

function Header() {
    return (
        <Navbar className="bg-body-tertiary px-3" fixed="top">
            <Navbar.Brand href="#home">
                <img
                    src="/Playfrens_Logo.png"
                    alt="Playfrens Logo"
                    width={30}
                    height={30}
                    className="d-inline-block align-top"
                />{" "}
                Playfrens
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                    <Nav.Link href="#link1">Link1</Nav.Link>
                    <Nav.Link href="#link2">Link2</Nav.Link>
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
                    />
                    <Button type="submit">Submit</Button>
                </Form>
            </Navbar.Collapse>
        </Navbar>
    );
}

function SidebarContent() {
    return (
        <>
            <Row className="h-50 border-bottom border-2 border-secondary-subtle align-content-start">
                <ToggleButtonGroup
                    type="checkbox"
                    vertical="true"
                    name="tbg-friends"
                    className="tbg-friends"
                >
                    <ToggleButton id="tbg-check-1" value={1}>
                        Friend 1
                    </ToggleButton>
                    <ToggleButton id="tbg-check-2" value={2}>
                        Friend 2
                    </ToggleButton>
                    <ToggleButton id="tbg-check-3" value={3}>
                        Friend 3
                    </ToggleButton>
                    <ToggleButton id="tbg-check-4" value={4}>
                        Friend 4
                    </ToggleButton>
                </ToggleButtonGroup>
            </Row>
            <Row className="h-50 align-content-start">
                <ToggleButtonGroup
                    type="radio"
                    defaultValue={1}
                    vertical="true"
                    name="tbg-categories"
                    className="tbg-categories"
                >
                    <ToggleButton id="tbg-radio-1" value={1}>
                        All
                    </ToggleButton>
                    <ToggleButton id="tbg-radio-2" value={2}>
                        Looking For More
                    </ToggleButton>
                    <ToggleButton id="tbg-radio-3" value={3}>
                        Ongoing
                    </ToggleButton>
                    <ToggleButton id="tbg-radio-4" value={4}>
                        Round-Based
                    </ToggleButton>
                    <ToggleButton id="tbg-radio-5" value={5}>
                        Finished
                    </ToggleButton>
                </ToggleButtonGroup>
            </Row>
        </>
    );
}

function ContentBody() {
    return (
        <Container fluid className="content-body">
            <Row className="h-100">
                <Col md={3} className="sidebar">
                    <SidebarContent></SidebarContent>
                </Col>
                <Col md={9}>
                    <GamesGrid></GamesGrid>
                </Col>
            </Row>
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
