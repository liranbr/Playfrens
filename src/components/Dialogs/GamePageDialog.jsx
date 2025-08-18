import { useState } from "react";
import { observer } from "mobx-react-lite";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MdAdd, MdClose, MdDeleteOutline, MdEdit, MdMoreVert, MdRemove } from "react-icons/md";
import { CenterAndEdgesRow, IconButton, ScrollView } from "@/components";
import { Dialogs, dialogStore, useDataStore } from "@/stores";
import { tagTypes, tagTypeStrings } from "@/models";
import { useValidatedImage } from "@/hooks/useValidatedImage.js";
import { DialogBase } from "./DialogRoot.jsx";
import "@/components/TagButtonGroup.css";
import "@/components/TagButton.css";
import "./GamePageDialog.css";

const AddTagButton = ({ tagType, game }) => {
    const dataStore = useDataStore();
    const allTagsOfType = [...dataStore.allTags[tagType].values()];
    const [openDropdown, setOpenDropdown] = useState(false);

    return (
        <DropdownMenu.Root onOpenChange={setOpenDropdown}>
            <DropdownMenu.Trigger asChild>
                <IconButton icon={<MdAdd />} activate={openDropdown} />
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="rx-dropdown-menu"
                    align={"start"}
                    side={"bottom"}
                    sideOffset={5}
                >
                    <ScrollView>
                        {allTagsOfType
                            .filter((t) => !game.hasTag(t))
                            .map((t) => (
                                <DropdownMenu.Item
                                    key={t.id}
                                    onClick={() => {
                                        game.addTag(t);
                                    }}
                                >
                                    <span className="item-label">{t.name}</span>
                                </DropdownMenu.Item>
                            ))}
                        {/* Variable-length dropdown items need text wrapper (span) to prevent overflow */}
                    </ScrollView>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

const GPTagButton = observer(({ game, tag }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const handleRemove = () => game.removeTag(tag);
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
        >
            <span role="button" className="tag-button" draggable="true">
                <span className="tag-name">{tag.name}</span>
            </span>

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
                        <DropdownMenu.Item data-danger onClick={handleRemove}>
                            <MdRemove /> Remove
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </div>
    );
});

const GPTagButtonGroup = observer(({ game, tagType }) => {
    const dataStore = useDataStore();
    const title = tagTypeStrings[tagType].plural.toUpperCase();
    const tags = [...game.tagIDs[tagType]].map((id) => dataStore.getTagByID(id, tagType));
    return (
        <div className="tag-button-group">
            <CenterAndEdgesRow className="ui-card-header">
                <div />
                <h4>{title}</h4>
                <AddTagButton tagType={tagType} game={game} />
            </CenterAndEdgesRow>
            <ScrollView>
                <div className="tag-button-list">
                    {tags.map((tag) => (
                        <GPTagButton key={tag.id} game={game} tag={tag} />
                    ))}
                </div>
            </ScrollView>
        </div>
    );
});

function GameOptionsButton({ game }) {
    const dataStore = useDataStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    return (
        <DropdownMenu.Root onOpenChange={setDropdownOpen}>
            <DropdownMenu.Trigger asChild>
                <IconButton icon={<MdMoreVert />} activate={dropdownOpen} />
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
                            dialogStore.open(Dialogs.EditGame, { game });
                        }}
                    >
                        <MdEdit /> Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                        data-danger
                        onClick={() => {
                            dialogStore.open(Dialogs.DeleteWarning, {
                                itemName: game.title,
                                deleteFunction: () => {
                                    dataStore.removeGame(game);
                                    dialogStore.closeMultiple(2);
                                },
                            });
                        }}
                    >
                        <MdDeleteOutline /> Delete
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

export const GamePageDialog = observer(({ open, closeDialog, game }) => {
    const gameCover = useValidatedImage(game.coverImageURL);
    const handleHide = () => closeDialog();

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
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DialogBase>
    );
});
