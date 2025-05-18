import { Row } from "react-bootstrap";
import { MdAdd } from "react-icons/md";
import { SidebarButton } from "./SidebarButton.jsx";
import "./SidebarGroup.css";

export function SidebarGroup({ dataType, dataList, setSelection, handleShowModal }) {
    const title = dataType.plural.toUpperCase();
    return (
        <Row className="sidebar-group">
            <div className="sidebar-header">
                <div />
                <p className="sidebar-title text-stroke-1px">{title}</p>
                <button className="icon-button" onClick={() => handleShowModal(dataType)}>
                    <MdAdd />
                </button>
            </div>
            <div className="sidebar-buttons-list">
                {dataList.map((item, index) =>
                    <SidebarButton
                        key={index}
                        value={item}
                        dataType={dataType}
                        setSelection={setSelection}
                        handleShowModal={handleShowModal}
                    />
                )}
            </div>
        </Row>
    );
}