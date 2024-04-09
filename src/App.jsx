import './App.css'
import {useState} from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'
import Button from 'react-bootstrap/Button'


import {Navbar, Container, Nav, NavDropdown} from "react-bootstrap";

function NavbarStart() {
    return (
        <Navbar expand="lg" className="bg-body-tertiary" fixed="top">
            <Container fluid>
                <Navbar.Brand href="#home" pla>Playfrens</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto" variant="pills">
                        <Nav.Link href="#home">Home</Nav.Link>
                        <Nav.Link href="#link">Link</Nav.Link>
                        <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                            <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                            <NavDropdown.Item href="#action/3.2">
                                Another action
                            </NavDropdown.Item>
                            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item href="#action/3.4">
                                Separated link
                            </NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default NavbarStart;

// TODO: First, recreate Game Grid element