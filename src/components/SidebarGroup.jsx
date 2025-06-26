import { Row } from "react-bootstrap";
import { MdAdd } from "react-icons/md";
import { SidebarButton } from "./SidebarButton.jsx";
import "./SidebarGroup.css";
import { modalStore } from "./Modals/ModalStore.jsx";

export function SidebarGroup({ dataType, dataList, setSelection }) {
    const title = dataType.plural.toUpperCase();
    const handleAddButtonClick = () => {
        modalStore.open("EditData", { dataType: dataType });
    };
    return (
        <Row className="sidebar-group">
            <div className="sidebar-header">
                <div />
                <p className="sidebar-title text-stroke-1px">{title}</p>
                <button className="icon-button" onClick={handleAddButtonClick}>
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
                    />
                )}
            </div>
        </Row>
    );
}