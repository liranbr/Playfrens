import { MdAdd, MdMoreVert } from "react-icons/md";
import "../App.css";
import "./Components.css";
import { Row, ToggleButton } from "react-bootstrap";
import React, { useEffect, useRef, useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { createPortal } from "react-dom";

export const IconToggle = React.forwardRef(({ onClick }, ref) => (
    <button className="icon-button"
            ref={ref}
            onClick={onClick}>
        <MdMoreVert />
    </button>
));
IconToggle.displayName = "IconToggle";

export function PortaledDropdown({ buttonRef, show, onClose, children, offsetX = 0, offsetY = 0 }) {
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (show && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.top + offsetY,
                left: rect.left + offsetX
            });
        }
    }, [show, buttonRef, offsetX, offsetY]);

    useEffect(() => {
        function handleClickOutside(e) {
            if (show && buttonRef.current && !buttonRef.current.contains(e.target)) {
                onClose();
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [show, buttonRef, onClose]);

    if (!show) return null;

    return createPortal(
        <div
            style={{
                position: "absolute",
                top: menuPosition.top,
                left: menuPosition.left,
                zIndex: 1050
            }}
        >
            <Dropdown.Menu show>
                {children}
            </Dropdown.Menu>
        </div>,
        document.body
    );
}

export function SidebarButton({ value, dataTypeKey, setSelection }) {
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
    const [showDropdown, setShowDropdown] = useState(false);
    const buttonRef = useRef(null);
    const handleToggleDropdown = () => {
        setShowDropdown(prev => !prev);
    };
    const handleCloseDropdown = () => {
        setShowDropdown(false);
    };

    return (
        <ToggleButton
            id={"btn-sidebar-" + dataTypeKey + "-" + value}
            value={value}
            className="sidebar-button"
            type="checkbox"
            checked={checked}
            draggable="true"
            active={showDropdown}
            onChange={handleChange}
            onDragStart={(e) => {
                e.dataTransfer.setData("item", value);
                e.dataTransfer.setData("dataTypeKey", dataTypeKey);
            }}
        >
            {value}
            <button className="icon-button" ref={buttonRef} onClick={handleToggleDropdown}>
                <MdMoreVert />
                <PortaledDropdown
                    buttonRef={buttonRef}
                    show={showDropdown}
                    onClose={handleCloseDropdown}
                    offsetY={35}
                >
                    <Dropdown.Item eventKey="1">Action</Dropdown.Item>
                    <Dropdown.Item eventKey="2">Another action</Dropdown.Item>
                    <Dropdown.Item eventKey="3">Action 3</Dropdown.Item>
                </PortaledDropdown>
            </button>
        </ToggleButton>
    );
}

export function SidebarGroup({ dataType, dataList, setSelection, handleShowModal }) {
    const title = dataType.plural.toUpperCase();
    return (
        <Row className="sidebar-group">
            <div className="sidebar-header">
                <div />
                <p className="sidebar-title">{title}</p>
                <button className="icon-button" onClick={() => handleShowModal(dataType)}>
                    <MdAdd />
                </button>
            </div>
            <div className="sidebar-buttons-list">
                {dataList.map((item, index) =>
                    <SidebarButton
                        key={index}
                        value={item}
                        dataTypeKey={dataType.key}
                        setSelection={setSelection}
                    />
                )}
            </div>
        </Row>
    );
}