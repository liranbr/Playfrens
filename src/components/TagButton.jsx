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
import { useFilterStore, Dialogs, dialogStore, useDataStore } from "@/stores";
import { IconButton } from "@/components";
import "./TagButton.css";

export const SidebarTagButton = observer(({ tag }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const filterStore = useFilterStore();
    const isSelected = filterStore.isTagSelected(tag) ? " selected" : "";
    const isExcluded = filterStore.isTagExcluded(tag) ? " excluded" : "";
    const isBeingDragged = filterStore.draggedTag?.id === tag.id ? " being-dragged" : "";
    const isDropdownOpen = dropdownOpen ? " dd-open" : "";
    const gameAmountInCurrentFilter = filterStore.filteredGames.filter((game) =>
        game.hasTag(tag),
    ).length;

    const onClick = () => {
        filterStore.toggleTagSelection(tag);
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
                onMouseEnter={() => filterStore.setHoveredTag(tag)}
                onMouseLeave={() => filterStore.setHoveredTag(null)}
                draggable="true"
                onDragStart={(e) => {
                    filterStore.setHoveredTag(null);
                    filterStore.setDraggedTag(tag);
                    e.dataTransfer.setData("application/json", JSON.stringify(tag));
                }}
                onDragEnd={() => filterStore.setDraggedTag(null)}
            >
                <span className="tag-name">{tag.name}</span>
                <label>{gameAmountInCurrentFilter !== 0 ? gameAmountInCurrentFilter : ""}</label>
                <MdDragIndicator className="hover-drag-indicator" />
            </span>
            <SidebarTBMenuButton
                tag={tag}
                filterStore={filterStore}
                setDropdownOpen={setDropdownOpen}
            />
        </div>
    );
});

const SidebarTBMenuButton = observer(({ tag, filterStore, setDropdownOpen }) => {
    const dataStore = useDataStore();
    const excludeLabel = filterStore.isTagExcluded(tag) ? "Undo Exclude" : "Exclude";
    const toggleExclusion = () => filterStore.toggleTagExclusion(tag);

    const openEditDialog = () => {
        dialogStore.open(Dialogs.EditTag, {
            editingTag: tag,
        });
    };
    const openDeleteDialog = () => {
        dialogStore.open(Dialogs.DeleteWarning, {
            itemName: tag.name,
            deleteFunction: () => {
                filterStore.removeFiltersOfTag(tag);
                dataStore.removeTag(tag);
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
                        <MdOutlineSearchOff /> {excludeLabel}
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
