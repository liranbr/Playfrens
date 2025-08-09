import { useState } from "react";
import { observer } from "mobx-react-lite";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
    MdDeleteOutline,
    MdDragIndicator,
    MdEdit,
    MdMoreVert,
    MdOutlineSearchOff,
} from "react-icons/md";
import { removeTag, tagGameCount, useFilterStore } from "@/stores";
import { IconButton } from "@/components";
import { Dialogs, dialogStore } from "./Dialogs/DialogStore.jsx";
import "./TagButton.css";

export const SidebarTagButton = observer(({ tagName, tagType }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const filterStore = useFilterStore();
    const isSelected = filterStore.isTagSelected(tagType, tagName) ? " selected" : "";
    const isExcluded = filterStore.isTagExcluded(tagType, tagName) ? " excluded" : "";
    const isBeingDragged =
        filterStore.draggedTag.tagType === tagType && filterStore.draggedTag.tagName === tagName
            ? " being-dragged"
            : "";
    const isDropdownOpen = dropdownOpen ? " dd-open" : "";
    const gameCount = tagGameCount(tagType, tagName, true);

    const onClick = () => {
        filterStore.toggleTagSelection(tagType, tagName);
        filterStore.setHoveredTag(null);
    };

    return (
        <div
            className={
                "tag-button-container sidebar-tbc" +
                isSelected +
                isExcluded +
                isDropdownOpen +
                isBeingDragged
            }
        >
            <span
                role="button"
                className={"tag-button"}
                tabIndex={0}
                onClick={onClick}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                        e.preventDefault();
                        onClick();
                    }
                }}
                onMouseEnter={() => filterStore.setHoveredTag(tagType, tagName)}
                onMouseLeave={() => filterStore.setHoveredTag(null)}
                draggable="true"
                onDragStart={(e) => {
                    filterStore.setHoveredTag(null);
                    filterStore.setDraggedTag(tagType, tagName);
                    e.dataTransfer.setData("tagName", tagName);
                    e.dataTransfer.setData("tagTypeKey", tagType.key);
                }}
                onDragEnd={() => filterStore.setDraggedTag(null)}
            >
                <span className="tag-name">{tagName}</span>
                <label>{gameCount !== 0 ? gameCount : ""}</label>
                <MdDragIndicator className="hover-drag-indicator" />
            </span>
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
