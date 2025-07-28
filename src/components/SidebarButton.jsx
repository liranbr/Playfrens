import { useState } from "react";
import { ToggleButton } from "react-bootstrap";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MdDeleteOutline, MdEdit, MdMoreVert, MdOutlineSearchOff } from "react-icons/md";
import { removeTag } from "../DataStore.jsx";
import "./SidebarButton.css";
import { Dialogs, dialogStore } from "./Dialogs/DialogStore.jsx";
import { useFilterStore } from "../FilterStore.jsx";
import { observer } from "mobx-react-lite";
import { IconButton } from "./common/IconButton.jsx";

export const SidebarButton = observer(({ value, tagType }) => {
    const filterStore = useFilterStore();
    const isSelected = filterStore.selectedTags[tagType.key]?.has(value) ?? false;
    const isExcluded = filterStore.excludedTags[tagType.key]?.has(value) ?? false;
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const toggleSelection = () => filterStore.toggleTagSelection(tagType, value);

    return (
        <ToggleButton
            id={"btn-sidebar-" + tagType.key + "-" + value}
            value={value}
            className={
                "sidebar-button" + (isSelected ? " selected" : "") + (isExcluded ? " excluded" : "")
            }
            type="checkbox"
            checked={isSelected}
            excluded={"" + isExcluded}
            active={dropdownOpen}
            draggable="true"
            onChange={toggleSelection}
            onDragStart={(e) => {
                e.dataTransfer.setData("item", value);
                e.dataTransfer.setData("tagTypeKey", tagType.key);
            }}
        >
            {value}
            <DropdownMenu.Root onOpenChange={setDropdownOpen}>
                <DropdownMenu.Trigger asChild>
                    <IconButton>
                        <MdMoreVert />
                    </IconButton>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className="rx-dropdown-menu"
                        align={"start"}
                        side={"bottom"}
                        sideOffset={5}
                    >
                        <DropdownMenu.Item
                            onClick={() => {
                                filterStore.toggleTagExclusion(tagType, value);
                            }}
                        >
                            <MdOutlineSearchOff /> {isExcluded ? "Undo Exclude" : "Exclude"}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            onClick={() => {
                                dialogStore.open(Dialogs.EditTag, {
                                    tagType: tagType,
                                    tagName: value,
                                });
                            }}
                        >
                            <MdEdit /> Edit
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            data-danger
                            onClick={() => {
                                dialogStore.open(Dialogs.DeleteWarning, {
                                    itemName: value,
                                    deleteFunction: () => {
                                        toggleSelection(false);
                                        filterStore.removeFiltersOfTag(tagType, value);
                                        removeTag(tagType, value);
                                    },
                                });
                            }}
                        >
                            <MdDeleteOutline /> Delete
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </ToggleButton>
    );
});
