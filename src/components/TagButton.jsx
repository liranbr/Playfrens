import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MdDeleteOutline, MdEdit, MdMoreVert, MdOutlineSearchOff } from "react-icons/md";
import { removeTag } from "../stores/DataStore.jsx";
import "./TagButton.css";
import { Dialogs, dialogStore } from "./Dialogs/DialogStore.jsx";
import { useFilterStore } from "../stores/FilterStore.jsx";
import { observer } from "mobx-react-lite";
import { IconButton } from "./common/IconButton.jsx";

export const SidebarTagButton = observer(({ tagName, tagType }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const filterStore = useFilterStore();
    const isSelected = filterStore.isTagSelected(tagType, tagName) ? " selected" : "";
    const isExcluded = filterStore.isTagExcluded(tagType, tagName) ? " excluded" : "";
    const isDropdownOpen = dropdownOpen ? " dd-open" : "";

    const toggleSelection = () => filterStore.toggleTagSelection(tagType, tagName);

    return (
        <div
            className={
                "tag-button-container sidebar-tbc" + isSelected + isExcluded + isDropdownOpen
            }
        >
            <button
                value={tagName}
                className={"tag-button"}
                onClick={() => {
                    toggleSelection();
                    filterStore.setHoveredTag(null, null);
                }}
                draggable="true"
                onDragStart={(e) => {
                    e.dataTransfer.setData("tagName", tagName);
                    e.dataTransfer.setData("tagTypeKey", tagType.key);
                }}
                onMouseOver={() => {
                    filterStore.setHoveredTag(tagType, tagName);
                }}
                onMouseLeave={() => {
                    filterStore.setHoveredTag(null, null);
                }}
            >
                {tagName}
            </button>
            <SidebarTBMenuButton
                tagName={tagName}
                tagType={tagType}
                filterStore={filterStore}
                setDropdownOpen={setDropdownOpen}
            />
        </div>
    );
});

const SidebarTBMenuButton = observer(({ tagName, tagType, filterStore, setDropdownOpen }) => {
    const isExcluded = filterStore.excludedTags[tagType.key]?.has(tagName) ?? false;
    const toggleExclusion = () => filterStore.toggleTagExclusion(tagType, tagName);

    const openEditDialog = () => {
        dialogStore.open(Dialogs.EditTag, {
            tagType: tagType,
            tagName: tagName,
        });
    };
    const openDeleteDialog = () => {
        dialogStore.open(Dialogs.DeleteWarning, {
            itemName: tagName,
            deleteFunction: () => {
                filterStore.removeFiltersOfTag(tagType, tagName);
                removeTag(tagType, tagName);
            },
        });
    };

    return (
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
                    <DropdownMenu.Item onClick={toggleExclusion}>
                        <MdOutlineSearchOff /> {isExcluded ? "Undo Exclude" : "Exclude"}
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={openEditDialog}>
                        <MdEdit /> Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Item data-danger onClick={openDeleteDialog}>
                        <MdDeleteOutline /> Delete
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
});
