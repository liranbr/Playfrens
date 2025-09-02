import { useState } from "react";
import { observer } from "mobx-react-lite";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
    MdDeleteOutline,
    MdDragHandle,
    MdEdit,
    MdMoreVert,
    MdOutlineSearchOff,
} from "react-icons/md";
import {
    useFilterStore,
    Dialogs,
    globalDialogStore,
    useDataStore,
    useSettingsStore,
} from "@/stores";
import { IconButton } from "@/components";
import "./TagButton.css";
import { TagObject } from "@/models/index.js";

export const SidebarTagButton = observer(({ tag }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [draggedOver, setDraggedOver] = useState(false);
    const filterStore = useFilterStore();
    const settingsStore = useSettingsStore();
    const dataStore = useDataStore();

    // CSS for button different states
    const classes = ["tag-button-container", "sidebar-tbc"];
    if (filterStore.isTagSelected(tag)) classes.push("selected");
    if (filterStore.isTagExcluded(tag)) classes.push("excluded");
    if (filterStore.draggedTag?.id === tag.id) classes.push("being-dragged");
    if (dropdownOpen) classes.push("dd-open");

    // Handling Custom Sorting, when another tag is being dragged over this one
    const draggedTag = filterStore.draggedTag;
    let onDrop = undefined;
    let onDragOver = undefined;
    let onDragLeave = undefined;
    if (
        draggedTag &&
        settingsStore.tagSortMethods[tag.type] === "custom" &&
        draggedTag.type === tag.type &&
        draggedTag.id !== tag.id
    ) {
        onDrop = () => {
            setDraggedOver(false);
            dataStore.moveTagCustomPosition(draggedTag, tag);
        };
        onDragOver = (e) => {
            setDraggedOver(true);
            e.preventDefault();
        };
        onDragLeave = () => setDraggedOver(false);
        if (draggedOver) classes.push("dragged-over");
    }

    // Handling the tag's Game Count display
    const gameCounterType = settingsStore.tagGameCounterDisplay;
    const gameCounter = {
        countFiltered: tag.filteredGamesCount,
        countTotal: tag.totalGamesCount,
        none: 0, // 0 is not displayed, so for the "none" option, this shows nothing
    }[gameCounterType];

    const onClick = () => {
        filterStore.toggleTagSelection(tag);
        filterStore.setHoveredTag(null);
    };

    return (
        <div
            className={classes.join(" ")}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
        >
            <span
                role="button"
                className={"tag-button"}
                tabIndex={0}
                onClick={onClick}
                onContextMenu={(e) => {
                    e.preventDefault(); // don't open right-click context menu
                    setDropdownOpen(true); // open button's dropdown instead
                }}
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
                <label>{gameCounter !== 0 ? gameCounter : ""}</label>
                <MdDragHandle className="hover-drag-indicator" />
            </span>
            <SidebarTBMenuButton
                tag={tag}
                filterStore={filterStore}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
            />
        </div>
    );
});

const SidebarTBMenuButton = observer(({ tag, filterStore, dropdownOpen, setDropdownOpen }) => {
    const dataStore = useDataStore();
    const excludeLabel = filterStore.isTagExcluded(tag) ? "Undo Exclude" : "Exclude";
    const toggleExclusion = () => filterStore.toggleTagExclusion(tag);

    const openEditDialog = () => {
        globalDialogStore.open(Dialogs.EditTag, {
            editingTag: tag,
        });
    };
    const openDeleteDialog = () => {
        globalDialogStore.open(Dialogs.DeleteWarning, {
            itemName: tag.name,
            deleteFunction: () => {
                filterStore.removeFiltersOfTag(tag);
                dataStore.removeTag(tag);
            },
        });
    };

    return (
        <DropdownMenu.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
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
