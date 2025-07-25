import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MdAdd, MdClose, MdDeleteOutline, MdEdit, MdMoreVert } from "react-icons/md";
import { observer } from "mobx-react-lite";
import { Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { removeGame } from "../../Store.jsx";
import { useValidatedImage } from "../../hooks/useValidatedImage.js";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { tagTypes } from "../../models/TagTypes.jsx";
import "./GamePageDialog.css";
import { Dialogs, dialogStore } from "./DialogStore.jsx";
import { useState } from "react";

const AddTagDropdown = ({ tagType, game }) => {
    const [open, setOpen] = useState(false);
    return (
        <DropdownMenu.Root onOpenChange={setOpen}>
            <DropdownMenu.Trigger asChild>
                <button className={"icon-button" + (open ? " open" : "")}>
                    <MdAdd />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="rx-dropdown-menu"
                    align={"start"}
                    side={"bottom"}
                    sideOffset={5}
                >
                    {tagType.allTagsList
                        .filter((item) => !tagType.gameTagsList(game).includes(item))
                        .map((item) => (
                            <DropdownMenu.Item
                                key={item}
                                onClick={() => {
                                    tagType.addToGame(game, item);
                                }}
                            >
                                {item}
                            </DropdownMenu.Item>
                        ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

const GPDSidebarGroup = observer(({ game, tagType }) => {
    const title = tagType.plural.toUpperCase();
    const gameTagsList = tagType.gameTagsList(game);
    const handleRemove = (item) => {
        tagType.removeFromGame(game, item);
    };
    return (
        <div className="sidebar-group">
            <div className="sidebar-header">
                <div />
                <h4>{title}</h4>
                <AddTagDropdown tagType={tagType} game={game} />
            </div>
            <div className="sidebar-buttons-list">
                {gameTagsList.map((item, index) => (
                    <OverlayTrigger
                        key={"btn-overlay-" + tagType.key + "-" + item + "-" + index}
                        placement={"right"}
                        overlay={<Tooltip style={{ transition: "none" }}>Remove</Tooltip>}
                    >
                        <Button
                            value={item}
                            className="sidebar-button gp-sidebar-button"
                            draggable="true"
                            onClick={() => handleRemove(item)}
                        >
                            {item}
                        </Button>
                    </OverlayTrigger>
                ))}
            </div>
        </div>
    );
});

function GameOptionsButton({ game }) {
    const [open, setOpen] = useState(false);
    return (
        <DropdownMenu.Root onOpenChange={setOpen}>
            <DropdownMenu.Trigger asChild>
                <button className={"icon-button" + (open ? " open" : "")}>
                    <MdMoreVert />
                </button>
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
                    <div className="gp-cover-art" style={{ "--bg-url": `url("${gameCover}")` }} />
                    <div className="gp-container">
                        <div className="gp-header">
                            <GameOptionsButton game={game} />
                            <Dialog.Title autoFocus className="gp-title">
                                {game.title}
                            </Dialog.Title>
                            <button className="icon-button ms-auto" onClick={handleHide}>
                                <MdClose />
                            </button>
                        </div>
                        <div className="gp-header-shadow" />
                        <div className="gp-body">
                            <div className="gp-column">
                                <div className="sidebar gp-element">
                                    <GPDSidebarGroup tagType={tagTypes.friend} game={game} />
                                    <div className="sidebar-separator" />
                                    <GPDSidebarGroup tagType={tagTypes.category} game={game} />
                                    <div className="sidebar-separator" />
                                    <GPDSidebarGroup tagType={tagTypes.status} game={game} />
                                </div>
                            </div>
                            <div className="gp-column">
                                <div className="game-note-container gp-element">
                                    <div className="sidebar-header">
                                        <div />
                                        <h4>NOTE</h4>
                                        <div />
                                    </div>
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
