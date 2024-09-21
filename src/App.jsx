import {useState} from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import {Button, Col, Form, Nav, Navbar, NavDropdown, Row} from "react-bootstrap";

function Header() {
    return (
        <Navbar className="bg-body-tertiary justify-content-between px-3" fixed="top">
            <Navbar.Brand href="#home">
                <img src="/Playfrens_Logo.png" alt="Playfrens Logo"
                     width={30} height={30} className="d-inline-block align-top"/>
                {' '}Playfrens
            </Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav"/>
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                    <Nav.Link href="#link1">Link1</Nav.Link>
                    <Nav.Link href="#link2">Link2</Nav.Link>
                    <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                        <NavDropdown.Item href="#action/3.1">Action</NavDropdown.Item>
                        <NavDropdown.Item href="#action/3.2">Another action</NavDropdown.Item>
                        <NavDropdown.Item href="#action/3.3">Something</NavDropdown.Item>
                        <NavDropdown.Divider/>
                        <NavDropdown.Item href="#action/3.4">Separated link</NavDropdown.Item>
                    </NavDropdown>
                </Nav>
                <Form inline className="d-flex">
                    <Form.Control type="text" placeholder="Search" className="me-2"/>
                    <Button type="submit">Submit</Button>
                </Form>
            </Navbar.Collapse>
        </Navbar>
    );
}

function Body() {
    const [count, setCount] = useState(0)

    return (
        <>
            <div>
                <a href="https://vitejs.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo"/>
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo"/>
                </a>
            </div>
            <h1>Vite + React</h1>
            <div className="card">
                <button onClick={() => setCount((count) => count + 1)}>
                    count is {count}
                </button>
                <p>
                    Edit <code>src/App.jsx</code> and save to test HMR
                </p>
            </div>
            <p className="read-the-docs">
                Click on the Vite and React logos to learn more
            </p>
        </>
    )
}

export default function App() {
    return <>
        <Header></Header>
        <Body/>
    </>
}
