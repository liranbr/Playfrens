import { MdAdd } from "react-icons/md";
import { SidebarButton } from "./SidebarButton.jsx";
import "./Sidebar.css";
import { Modals, modalStore } from "./Modals/ModalStore.jsx";

export function SidebarGroup({ dataType, dataList, setSelection }) {
    const title = dataType.plural.toUpperCase();
    const handleAddButtonClick = () => {
        modalStore.open(Modals.EditData, { dataType: dataType });
    };
    return (
        <div className="sidebar-group">
            <div className="sidebar-header">
                <div />
                <h4>{title}</h4>
                <button className="icon-button" onClick={handleAddButtonClick}>
                    <MdAdd />
                </button>
            </div>
            <div className="sidebar-buttons-list">
                {dataList.map((item, index) => (
                    <SidebarButton
                        key={index}
                        value={item}
                        dataType={dataType}
                        setSelection={setSelection}
                    />
                ))}
            </div>
        </div>
    );
}
