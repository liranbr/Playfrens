import { MdAdd } from "react-icons/md";
import { SidebarButton } from "./SidebarButton.jsx";
import "./Sidebar.css";
import { Dialogs, dialogStore } from "./Dialogs/DialogStore.jsx";

export function SidebarGroup({ tagType, tagsList }) {
    const title = tagType.plural.toUpperCase();
    const handleAddButtonClick = () => {
        dialogStore.open(Dialogs.EditTag, { tagType: tagType });
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
                {tagsList.map((item, index) => (
                    <SidebarButton key={index} value={item} tagType={tagType} />
                ))}
            </div>
        </div>
    );
}
