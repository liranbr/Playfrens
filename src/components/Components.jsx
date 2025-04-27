import { useState } from "react";
import { Row, ToggleButton } from "react-bootstrap";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
    MdAdd, MdDeleteOutline, MdEdit, MdMoreVert, MdOutlineSearchOff
} from "react-icons/md";
import "../App.css";
import "./Components.css";

export function SidebarButton({ value, dataTypeKey, setSelection }) {
    const [checked, setChecked] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const handleChange = (e) => {
        const isChecked = e.currentTarget.checked;
        setChecked(isChecked); // set button state
        setSelection(prevSelection => {
            return isChecked
                ? [...prevSelection, value] // select filter
                : prevSelection.filter(item => item !== value); // deselect filter
        });
    };

    return (
        <ToggleButton
            id={"btn-sidebar-" + dataTypeKey + "-" + value}
            value={value}
            className="sidebar-button"
            type="checkbox"
            checked={checked}
            active={dropdownOpen}
            draggable="true"
            onChange={handleChange}
            onDragStart={(e) => {
                e.dataTransfer.setData("item", value);
                e.dataTransfer.setData("dataTypeKey", dataTypeKey);
            }}
        >
            {value}
            <DropdownMenu.Root onOpenChange={setDropdownOpen}>
                <DropdownMenu.Trigger asChild>
                    <button className="icon-button">
                        <MdMoreVert />
                    </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.Content className="dropdown-menu show"
                                          align={"start"} side={"bottom"} sideOffset={5}>
                        <DropdownMenu.Item className="dropdown-item">
                            <MdOutlineSearchOff className="dropdown-item-icon" />
                            Exclude
                        </DropdownMenu.Item>
                        <DropdownMenu.Item className="dropdown-item">
                            <MdEdit className="dropdown-item-icon" />
                            Edit
                        </DropdownMenu.Item>
                        <DropdownMenu.Item className="dropdown-item danger-item">
                            <MdDeleteOutline className="dropdown-item-icon danger-item" />
                            Delete
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
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