import { MdAdd } from "react-icons/md";
import "../App.css";
import "./Components.css";
import { Row, ToggleButton } from "react-bootstrap";
import { useState } from "react";

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

    return (
        <ToggleButton
            id={"btn-sidebar-" + dataTypeKey + "-" + value}
            value={value}
            className="sidebar-button"
            type="checkbox"
            checked={checked}
            draggable="true"
            onChange={handleChange}
            onDragStart={(e) => {
                e.dataTransfer.setData("item", value);
                e.dataTransfer.setData("dataTypeKey", dataTypeKey);
            }}
        >
            {value}
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