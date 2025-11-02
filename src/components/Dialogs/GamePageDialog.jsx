import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MdAdd, MdClose, MdDeleteOutline, MdEdit, MdMoreVert, MdRemove } from "react-icons/md";
import { CgRename } from "react-icons/cg";

import { Button, CenterAndEdgesRow, IconButton, ReminderCard, SimpleTooltip } from "@/components";
import {
    Dialogs,
    globalDialogStore,
    updateTagBothGameCounters,
    useDataStore,
    useFilterStore,
} from "@/stores";
import { ReminderObject, tagTypes, tagTypeStrings } from "@/models";
import { useValidatedImage } from "@/hooks/useValidatedImage.js";
import { DialogBase } from "./DialogRoot.jsx";

import "@/components/TagButtonGroup.css";
import "@/components/TagButton.css";
import "./GamePageDialog.css";

const DD = DropdownMenu;

const AddTagButton = ({ tagType, party }) => {
    const dataStore = useDataStore();
    const allTagsOfType = [...dataStore.allTags[tagType].values()];
    const tagsPartyDoesntHave = allTagsOfType.filter((t) => !party.hasTag(t));
    const [openDropdown, setOpenDropdown] = useState(false);
    const typeStrings = tagTypeStrings[tagType];

    if (tagsPartyDoesntHave.length !== 0)
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
                        {tagsPartyDoesntHave.map((t) => (
                            <DD.Item
                                key={t.id}
                                onClick={() => {
                                    party.addTag(t);
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

const GPTagButton = observer(({ party, tag }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const handleRemove = () => {
        party.removeTag(tag);
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

const GPTagButtonGroup = observer(({ party, tagType }) => {
    const dataStore = useDataStore();
    const title = tagTypeStrings[tagType].plural.toUpperCase();
    // Instead of sorting the tags inside every GameObject according to current sort-by settings (inefficient and awkward),
    // we'll just display a game's tags in its GamePage as they are ordered in the (auto sorted) DataStore
    const tags = [...party.tagIDs[tagType]]
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
                <AddTagButton tagType={tagType} party={party} />
            </CenterAndEdgesRow>
            <div className="tag-button-list">
                {tags.map((tag) => (
                    <GPTagButton key={tag.id} party={party} tag={tag} />
                ))}
            </div>
        </div>
    );
});

function GameOptionsButton({ game, party, setPartyID, renamePartyRef }) {
    const dataStore = useDataStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleDeleteGroup = () => {
        globalDialogStore.open(Dialogs.DeleteWarning, {
            itemName: party.name,
            deleteFunction: () => {
                game.deleteParty(party.id);
                setPartyID(game.parties[0].id);
            },
        });
    };

    const handleDeleteGame = () => {
        globalDialogStore.open(Dialogs.DeleteWarning, {
            itemName: game.title,
            deleteFunction: () => {
                dataStore.deleteGame(game);
                globalDialogStore.closeMultiple(2);
            },
        });
    };

    return (
        <DD.Root onOpenChange={setDropdownOpen}>
            <DD.Trigger asChild>
                <IconButton icon={<MdMoreVert />} activate={dropdownOpen} />
            </DD.Trigger>

            <DD.Portal>
                <DD.Content className="rx-dropdown-menu" align="start" side="bottom" sideOffset={5}>
                    <DD.Item onClick={() => game.createParty()}>
                        <MdAdd /> Add Group
                    </DD.Item>

                    {game.parties.length > 1 && (
                        <>
                            <DD.Item onClick={() => renamePartyRef.current?.(party)}>
                                <CgRename /> Rename Group
                            </DD.Item>
                            <DD.Item data-danger onClick={handleDeleteGroup}>
                                <MdDeleteOutline /> Delete Group
                            </DD.Item>
                        </>
                    )}
                    <DD.Separator />

                    <DD.Item
                        onClick={() => {
                            globalDialogStore.open(Dialogs.EditGame, { game });
                        }}
                    >
                        <MdEdit /> Edit Game
                    </DD.Item>

                    <DD.Item data-danger onClick={handleDeleteGame}>
                        <MdDeleteOutline /> Delete Game
                    </DD.Item>
                </DD.Content>
            </DD.Portal>
        </DD.Root>
    );
}

const AddReminderPopover = ({ game, party }) => {
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
            new ReminderObject({
                date: date,
                message: message,
                gameID: game.id,
                partyID: party.id,
            }),
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
                <Popover.Content align="center" className="rx-popover reminder-editor">
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

const PartyTabs = ({ game, partyID, setPartyID, renamePartyRef }) => {
    if (game.parties.length <= 1) return null;

    const [tempName, setTempName] = useState("");
    const [renamingID, setRenamingID] = useState("");
    renamePartyRef.current = (party) => {
        setTempName(party.name);
        setRenamingID(party.id);
    };
    const handleRename = () => {
        const renamedParty = game.getParty(renamingID);
        if (renamedParty.name !== tempName) {
            renamedParty.setName(tempName);
        }
        setRenamingID("");
    };
    const inputRef = useRef(null);
    useEffect(() => {
        inputRef.current?.select();
    }, [renamingID]); // selects the name of the renamed party upon rename start

    const filterStore = useFilterStore();
    const tabClassName = (party) => (filterStore.doesPartyPassFilters(party) ? "" : "filtered-out");

    return (
        <ToggleGroup.Root
            type="single"
            className="rx-toggle-group party-tabs"
            value={partyID}
            onValueChange={(value) => {
                if (value) setPartyID(value); // to avoid empty values
            }}
        >
            {game.parties.map((party) => (
                <ToggleGroup.Item
                    key={party.id}
                    value={party.id}
                    className={tabClassName(party)}
                    onDoubleClick={() => {
                        renamePartyRef.current?.(party);
                    }}
                >
                    {renamingID === party.id ? (
                        <input
                            ref={inputRef}
                            autoFocus
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            onBlur={handleRename}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleRename();
                            }}
                        />
                    ) : (
                        <span>{party.name}</span>
                    )}
                </ToggleGroup.Item>
            ))}
        </ToggleGroup.Root>
    );
};

export const GamePageDialog = observer(({ open, closeDialog, game, openOnPartyID }) => {
    const filterStore = useFilterStore();
    const firstPartyIDThatPassesFilters = () => {
        return (
            game.parties.find((party) => filterStore.doesPartyPassFilters(party)).id ??
            game.parties[0].id
        );
    };
    const [partyID, setPartyID] = useState(openOnPartyID ?? firstPartyIDThatPassesFilters());
    const party = game.getParty(partyID);
    const renamePartyRef = useRef(null);

    const gameCover = useValidatedImage(game.coverImageURL);
    const handleHide = () => closeDialog();
    const dataStore = useDataStore();
    const partyReminders = dataStore.sortedReminders.filter(
        (reminder) => reminder.gameID === game.id && reminder.partyID === party.id,
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
                <div className="gp-header">
                    <CenterAndEdgesRow>
                        <GameOptionsButton
                            game={game}
                            party={party}
                            setPartyID={setPartyID}
                            renamePartyRef={renamePartyRef}
                        />
                        <Dialog.Title autoFocus className="gp-title">
                            {game.title}
                        </Dialog.Title>
                        <IconButton icon={<MdClose />} onClick={handleHide} />
                    </CenterAndEdgesRow>
                    <PartyTabs
                        game={game}
                        partyID={partyID}
                        setPartyID={setPartyID}
                        renamePartyRef={renamePartyRef}
                    />
                </div>
                <div className="gp-header-shadow" />

                <div className="gp-body" key={partyID}>
                    <div className="gp-column">
                        <div className="ui-card">
                            <GPTagButtonGroup tagType={tagTypes.friend} party={party} />
                            <div className="separator" />
                            <GPTagButtonGroup tagType={tagTypes.category} party={party} />
                            <div className="separator" />
                            <GPTagButtonGroup tagType={tagTypes.status} party={party} />
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
                                value={party.note}
                                onChange={(e) => party.setNote(e.target.value)}
                                maxLength={2000}
                            />
                        </div>

                        <div className="ui-card reminders-container" id="reminders-container">
                            <CenterAndEdgesRow className="ui-card-header">
                                <div />
                                <h4>REMINDERS</h4>
                                <AddReminderPopover game={game} party={party} />
                            </CenterAndEdgesRow>

                            <div className="reminders-list">
                                {partyReminders.map((reminder) => (
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
