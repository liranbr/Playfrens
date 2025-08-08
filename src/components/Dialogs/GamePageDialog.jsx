import { useState } from "react";
import { observer } from "mobx-react-lite";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MdAdd, MdClose, MdDeleteOutline, MdEdit, MdMoreVert, MdRemove } from "react-icons/md";
import { CenterAndEdgesRow, IconButton, ScrollView } from "@/components";
import { removeGame } from "@/stores";
import { useValidatedImage } from "@/hooks/useValidatedImage.js";
import { tagTypes } from "@/models";
import { Dialogs, dialogStore } from "./DialogStore.jsx";
import "@/components/TagButtonGroup.css";
import "@/components/TagButton.css";
import "./GamePageDialog.css";

const AddTagButton = ({ tagType, game }) => {
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
                        {tagType.allTagsList
                            .filter((item) => !tagType.gameTagsList(game).includes(item))
                            .map((item) => (
                                <DropdownMenu.Item
                                    key={item}
                                    onClick={() => {
                                        tagType.addToGame(game, item);
                                    }}
                                >
                                    <span className="item-label">{item}</span>
                                </DropdownMenu.Item>
                            ))}
                        {/* Variable-length dropdown items need text wrapper to prevent overflow */}
                    </ScrollView>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

const GPTagButton = observer(({ game, tagType, tagName }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const handleRemove = () => {
        tagType.removeFromGame(game, tagName);
    };
    const onClick = () => setDropdownOpen(true);
    return (
        <div
            className={"tag-button-container" + (dropdownOpen ? " dd-open" : "")}
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
                    e.preventDefault();
                    onClick();
                }
            }}
        >
            <span role="button" className="tag-button" draggable="true">
                <span className="tag-name">{tagName}</span>
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
    const title = tagType.plural.toUpperCase();
    const gameTagsList = tagType.gameTagsList(game);
    return (
        <div className="tag-button-group">
            <CenterAndEdgesRow className="ui-card-header">
                <div />
                <h4>{title}</h4>
                <AddTagButton tagType={tagType} game={game} />
            </CenterAndEdgesRow>
            <ScrollView>
                <div className="tag-button-list">
                    {gameTagsList.map((tagName, index) => (
                        <GPTagButton
                            key={"btn-" + tagType.key + "-" + tagName + "-" + index}
                            game={game}
                            tagType={tagType}
                            tagName={tagName}
                        />
                    ))}
                </div>
            </ScrollView>
        </div>
    );
});

function GameOptionsButton({ game }) {
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
                                    removeGame(game);
                                    dialogStore.closeTwo();
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
        <Dialog.Root open={open} onOpenChange={handleHide}>
            <Dialog.Portal>
                <Dialog.Overlay className="rx-dialog-overlay" />
                <Dialog.Content
                    // Focuses the dialog content instead of the first interactable element
                    onOpenAutoFocus={(e) => {
                        e.preventDefault();
                        e.target.focus();
                    }}
                    className="rx-dialog game-page-dialog"
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
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
});
