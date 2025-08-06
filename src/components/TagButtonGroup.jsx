import { MdAdd } from "react-icons/md";
import { LuSettings2 } from "react-icons/lu";
import { observer } from "mobx-react-lite";
import { SidebarTagButton, IconButton, CenterAndEdgesRow, ScrollView } from "@/components";
import { Dialogs, dialogStore } from "./Dialogs/DialogStore.jsx";
import "./TagButtonGroup.css";

export const SidebarTagButtonGroup = observer(({ tagType }) => {
    const title = tagType.plural.toUpperCase();
    const handleAddButtonClick = () => {
        dialogStore.open(Dialogs.EditTag, { tagType: tagType });
    };
    return (
        <div className="tag-button-group">
            <CenterAndEdgesRow className="ui-card-header">
                <IconButton icon={<LuSettings2 />} style={{ padding: "5px" }} />
                <h4>{title}</h4>
                <IconButton icon={<MdAdd />} onClick={handleAddButtonClick} />
            </CenterAndEdgesRow>
            <ScrollView>
                <div className="tag-button-list">
                    {tagType.allTagsList.map((tagName, index) => (
                        <SidebarTagButton key={index} tagName={tagName} tagType={tagType} />
                    ))}
                </div>
            </ScrollView>
        </div>
    );
});
