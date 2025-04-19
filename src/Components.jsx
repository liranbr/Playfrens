import { MdAdd } from "react-icons/md";
import "./App.css";
import "./Components.css";
import { Row, ToggleButton } from "react-bootstrap";
import { useState } from "react";

export const ButtonAdd = ({ onClick, children }) => {
    return (
        <button className="icon-button" onClick={onClick}>
            <MdAdd />
            {children}
        </button>
    );
};

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

export function SidebarGroup({ dataType, dataList, setSelection }) {
    const title = dataType.plural.toUpperCase();
    return (
        <Row className="sidebar-group">
            <div className="sidebar-top-panel">
                <p className="sidebar-title">{title}</p>
                <div className="ms-auto">
                    <ButtonAdd />
                </div>
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