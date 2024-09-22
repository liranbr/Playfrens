import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { GamesGrid } from "./GameGrid.jsx";
import { Button, Form, Nav, Navbar, NavDropdown } from "react-bootstrap";

function Header() {
    return (
        <Navbar
            className="bg-body-tertiary justify-content-between px-3"
            fixed="top"
        >
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

function Body() {
    return (
        <>
            <GamesGrid></GamesGrid>
        </>
    );
}

export default function App() {
    return (
        <>
            <Header />
            <Body />
        </>
    );
}
