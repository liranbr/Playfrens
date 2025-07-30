import { MdAdd } from "react-icons/md";
import { SidebarTagButton } from "./TagButton.jsx";
import "./TagButtonGroup.css";
import { Dialogs, dialogStore } from "./Dialogs/DialogStore.jsx";
import { observer } from "mobx-react-lite";
import { IconButton } from "./common/IconButton.jsx";
import { CenterAndEdgesRow } from "./common/CenterAndEdgesRow.jsx";

export const SidebarTagButtonGroup = observer(({ tagType }) => {
    const title = tagType.plural.toUpperCase();
    const handleAddButtonClick = () => {
        dialogStore.open(Dialogs.EditTag, { tagType: tagType });
    };
    return (
        <div className="tag-button-group">
            <CenterAndEdgesRow className="ui-card-header">
                <div />
                <h4>{title}</h4>
                <IconButton icon={<MdAdd />} onClick={handleAddButtonClick} />
            </CenterAndEdgesRow>
            <div className="tag-button-list">
                {tagType.allTagsList.map((tagName, index) => (
                    <SidebarTagButton key={index} tagName={tagName} tagType={tagType} />
                ))}
            </div>
        </div>
    );
});
