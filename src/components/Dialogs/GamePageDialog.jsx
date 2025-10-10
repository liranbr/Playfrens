import { useState } from "react";
import { observer } from "mobx-react-lite";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MdAdd, MdClose, MdDeleteOutline, MdEdit, MdMoreVert, MdRemove } from "react-icons/md";

import { Button, CenterAndEdgesRow, IconButton, ReminderCard, SimpleTooltip } from "@/components";
import { Dialogs, globalDialogStore, updateTagBothGameCounters, useDataStore } from "@/stores";
import { ReminderObject, tagTypes, tagTypeStrings } from "@/models";
import { useValidatedImage } from "@/hooks/useValidatedImage.js";
import { DialogBase } from "./DialogRoot.jsx";

import "@/components/TagButtonGroup.css";
import "@/components/TagButton.css";
import "./GamePageDialog.css";
import * as Popover from "@radix-ui/react-popover";

const DD = DropdownMenu;

const AddTagButton = ({ tagType, game }) => {
    const dataStore = useDataStore();
    const allTagsOfType = [...dataStore.allTags[tagType].values()];
    const tagsGameDoesntHave = allTagsOfType.filter((t) => !game.hasTag(t));
    const [openDropdown, setOpenDropdown] = useState(false);
    const typeStrings = tagTypeStrings[tagType];

    if (tagsGameDoesntHave.length !== 0)
        return (
            <DD.Root onOpenChange={setOpenDropdown}>
                <DD.Trigger asChild>
                    <IconButton icon={<MdAdd />} activate={openDropdown} />
                </DD.Trigger>

                <DD.Portal>
                    <DD.Content
                        className="rx-dropdown-menu"
                        align={"start"}
                        side={"bottom"}
                        sideOffset={5}
                    >
                        {tagsGameDoesntHave.map((t) => (
                            <DD.Item
                                key={t.id}
                                onClick={() => {
                                    game.addTag(t);
                                    updateTagBothGameCounters(t);
                                }}
                            >
                                <span className="item-label">{t.name}</span>{" "}
                                {/* Dropdown items need a text wrapper (span) to prevent overflow */}
                            </DD.Item>
                        ))}
                    </DD.Content>
                </DD.Portal>
            </DD.Root>
        );
    else {
        const issueMessage =
            allTagsOfType.length === 0
                ? `No ${typeStrings.plural} added yet`
                : `Game already has all ${typeStrings.plural}`;
        if (openDropdown) setOpenDropdown(false);
        return (
            <SimpleTooltip delayDuration={300} message={issueMessage}>
                <IconButton icon={<MdAdd />} disabled />
            </SimpleTooltip>
        );
    }
};

const GPTagButton = observer(({ game, tag }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const handleRemove = () => {
        game.removeTag(tag);
        updateTagBothGameCounters(tag);
    };
    const handleClick = () => setDropdownOpen(true);

    return (
        <div
            className={"tag-button-container" + (dropdownOpen ? " dd-open" : "")}
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                    e.preventDefault();
                    handleClick();
                }
            }}
            onContextMenu={(e) => {
                e.preventDefault(); // don't open right-click context menu
                setDropdownOpen(true); // open button's dropdown instead
            }}
        >
            <span role="button" className="tag-button" draggable="true">
                <span className="tag-name">{tag.name}</span>
            </span>

            <DD.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DD.Trigger asChild>
                    <IconButton icon={<MdMoreVert />} />
                </DD.Trigger>

                <DD.Portal>
                    <DD.Content
                        className="rx-dropdown-menu"
                        align={"start"}
                        side={"bottom"}
                        sideOffset={5}
                    >
                        <DD.Item data-danger onClick={handleRemove}>
                            <MdRemove /> Remove
                        </DD.Item>
                    </DD.Content>
                </DD.Portal>
            </DD.Root>
        </div>
    );
});

const GPTagButtonGroup = observer(({ game, tagType }) => {
    const dataStore = useDataStore();
    const title = tagTypeStrings[tagType].plural.toUpperCase();
    // Instead of sorting the tags inside every GameObject according to current sort-by settings (inefficient and awkward),
    // we'll just display a game's tags in its GamePage as they are ordered in the (auto sorted) DataStore
    const tags = [...game.tagIDs[tagType]]
        .sort((id1, id2) => {
            const order = [...dataStore.allTags[tagType].keys()];
            return order.indexOf(id1) - order.indexOf(id2);
        })
        .map((id) => dataStore.getTagByID(id, tagType));
    return (
        <div className="tag-button-group">
            <CenterAndEdgesRow className="ui-card-header">
                <div />
                <h4>{title}</h4>
                <AddTagButton tagType={tagType} game={game} />
            </CenterAndEdgesRow>
            <div className="tag-button-list">
                {tags.map((tag) => (
                    <GPTagButton key={tag.id} game={game} tag={tag} />
                ))}
            </div>
        </div>
    );
});

function GameOptionsButton({ game }) {
    const dataStore = useDataStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    return (
        <DD.Root onOpenChange={setDropdownOpen}>
            <DD.Trigger asChild>
                <IconButton icon={<MdMoreVert />} activate={dropdownOpen} />
            </DD.Trigger>

            <DD.Portal>
                <DD.Content
                    className="rx-dropdown-menu"
                    align={"start"}
                    side={"bottom"}
                    sideOffset={5}
                >
                    <DD.Item
                        onClick={() => {
                            globalDialogStore.open(Dialogs.EditGame, { game });
                        }}
                    >
                        <MdEdit /> Edit
                    </DD.Item>
                    <DD.Item
                        data-danger
                        onClick={() => {
                            globalDialogStore.open(Dialogs.DeleteWarning, {
                                itemName: game.title,
                                deleteFunction: () => {
                                    dataStore.removeGame(game);
                                    globalDialogStore.closeMultiple(2);
                                },
                            });
                        }}
                    >
                        <MdDeleteOutline /> Delete
                    </DD.Item>
                </DD.Content>
            </DD.Portal>
        </DD.Root>
    );
}

const AddReminderPopover = ({ game }) => {
    // TODO: make popover its own component, to use in Adding + Editing, in GamePage + Notifications drawer
    const [open, setOpen] = useState(false);
    const [date, setDate] = useState(null);
    const [message, setMessage] = useState("");
    const dataStore = useDataStore();

    const handleDateChange = (e) => {
        const newDate = e.target.value ? new Date(e.target.value) : null;
        setDate(newDate);
    };

    const handleSave = () => {
        const added = dataStore.addReminder(
            new ReminderObject({ date: date, message: message, gameID: game.id }),
        );
        if (added) setOpen(false);
    };

    return (
        <Popover.Root
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);
                setDate(null);
                setMessage("");
            }}
        >
            <Popover.Trigger asChild>
                <IconButton icon={<MdAdd />} />
            </Popover.Trigger>
            <Popover.Portal container={document.getElementById("reminders-container")}>
                <Popover.Content align="center" className="rx-popover">
                    <Popover.Close asChild>
                        <IconButton className="popover-close" icon={<MdClose />} />
                    </Popover.Close>
                    <h3>Add Reminder</h3>
                    <input
                        className="date-input"
                        type="date"
                        value={date ? date.toISOString().split("T")[0] : ""}
                        onChange={handleDateChange}
                        autoFocus
                    />
                    <textarea
                        className="reminder-textarea"
                        rows={4}
                        spellCheck={false}
                        value={message}
                        placeholder="Message"
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={1000}
                    />
                    <Button variant="primary" disabled={!date || !message} onClick={handleSave}>
                        Save
                    </Button>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
};

export const GamePageDialog = observer(({ open, closeDialog, game }) => {
    const gameCover = useValidatedImage(game.coverImageURL);
    const handleHide = () => closeDialog();
    const dataStore = useDataStore();
    const gameReminders = dataStore.sortedReminders.filter(
        (reminder) => reminder.gameID === game.id,
    );

    return (
        <DialogBase
            open={open}
            onOpenChange={handleHide}
            contentProps={{
                // Focuses the dialog content instead of the first interactable element
                onOpenAutoFocus: (e) => {
                    e.preventDefault();
                    e.target.focus();
                },
                className: "rx-dialog game-page-dialog",
            }}
        >
            <VisuallyHidden>
                <Dialog.Description>{"Game Page of " + game.title}</Dialog.Description>
            </VisuallyHidden>
            <img className="gp-cover-art" src={gameCover} alt="Game cover art" />

            <div className="gp-container">
                <CenterAndEdgesRow className="gp-header">
                    <GameOptionsButton game={game} />
                    <Dialog.Title autoFocus className="gp-title">
                        {game.title}
                    </Dialog.Title>
                    <IconButton icon={<MdClose />} onClick={handleHide} />
                </CenterAndEdgesRow>
                <div className="gp-header-shadow" />

                <div className="gp-body">
                    <div className="gp-column">
                        <div className="ui-card">
                            <GPTagButtonGroup tagType={tagTypes.friend} game={game} />
                            <div className="separator" />
                            <GPTagButtonGroup tagType={tagTypes.category} game={game} />
                            <div className="separator" />
                            <GPTagButtonGroup tagType={tagTypes.status} game={game} />
                        </div>
                    </div>

                    <div className="gp-column">
                        <div className="ui-card game-note-container">
                            <CenterAndEdgesRow className="ui-card-header">
                                <div />
                                <h4>NOTE</h4>
                                <div />
                            </CenterAndEdgesRow>
                            <textarea
                                className="game-note"
                                rows={5}
                                spellCheck={false}
                                value={game.note}
                                onChange={(e) => game.setNote(e.target.value)}
                                maxLength={2000}
                            />
                        </div>

                        <div className="ui-card reminders-container" id="reminders-container">
                            <CenterAndEdgesRow className="ui-card-header">
                                <div />
                                <h4>REMINDERS</h4>
                                <AddReminderPopover game={game} />
                            </CenterAndEdgesRow>

                            <div className="reminders-list">
                                {gameReminders.map((reminder) => (
                                    <ReminderCard key={reminder.id} reminder={reminder} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DialogBase>
    );
});
