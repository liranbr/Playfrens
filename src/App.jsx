import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import React from 'react'
import {Navbar, Container, Nav, NavDropdown} from "react-bootstrap"
import GameGrid from "./GameGrid.jsx";

function PFNavbar() {
    return (
        <Navbar expand="lg" className="bg-body-tertiary" fixed="top">
            <Container fluid>
                <Navbar.Brand href="#home">
                    <img src="/PF_logo.png" alt="Playfrens logo"
                         height={30} width={30} className="d-inline-block align-top me-1"/>
                    Playfrens
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav"/>
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto" variant="pills">
                        <Nav.Link href="#home">Home</Nav.Link>
                        <Nav.Link href="#link">Link</Nav.Link>
                        <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                            <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                            <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                            <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
                        </NavDropdown>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

// contains all page content, with 56px topPadding to offset the navbar
function Content({children}) {
    return (
        <div style={{paddingTop: '56px'}} id="Content">
            {children}
        </div>
    )
}

export default function App() {
    return <>
        <PFNavbar></PFNavbar>
        <Content>
            <GameGrid></GameGrid>
        </Content>
    </>
}