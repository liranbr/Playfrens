import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { MdAdd, MdClose, MdDeleteOutline, MdEdit, MdMoreVert } from "react-icons/md";
import { observer } from "mobx-react-lite";
import { Button, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { OutlinedIcon } from "../Components.jsx";
import { removeGame } from "../../Store.jsx";
import { useValidatedImage } from "../../hooks/useValidatedImage.js";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { dataTypes } from "../../models/DataTypes.jsx";
import "./PlayfrensModal.css";
import { Modals, modalStore } from "./ModalStore.jsx";

const AddDataDropdown = ({ dataType, game }) => {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="icon-button">
                    <MdAdd />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="rx-dropdown-menu"
                    align={"start"} side={"bottom"} sideOffset={5}
                    style={{ pointerEvents: "auto" }}>
                    {dataType.allDataList.filter(item => !dataType.gameDataList(game).includes(item)).map(item => (
                        <DropdownMenu.Item key={item} onClick={() => {
                            dataType.addToGame(game, item);
                        }}>
                            {item}
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
};

const PFMSidebarGroup = observer(({ game, dataType }) => {
    const title = dataType.plural.toUpperCase();
    const gameDataList = dataType.gameDataList(game);
    const handleRemove = (item) => {
        dataType.removeFromGame(game, item);
    };
    return (
        <div className="sidebar-group">
            <div className="sidebar-header">
                <div />
                <h4>{title}</h4>
                <AddDataDropdown dataType={dataType} game={game} />
            </div>
            <div className="sidebar-buttons-list">
                {gameDataList.map((item, index) =>
                    <OverlayTrigger
                        key={"btn-modal-" + dataType.key + "-" + item + "-" + index}
                        placement={"right"}
                        overlay={<Tooltip style={{ transition: "none" }}>
                            Remove
                        </Tooltip>}>
                        <Button
                            value={item}
                            className="sidebar-button pfm-sidebar-button"
                            draggable="true"
                            onClick={() => handleRemove(item)}>
                            {item}
                        </Button>
                    </OverlayTrigger>
                )}
            </div>
        </div>
    );
});

function GameOptionsButton({ game }) {
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="icon-button">
                    <OutlinedIcon>
                        <MdMoreVert />
                    </OutlinedIcon>
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content className="rx-dropdown-menu"
                                      align={"start"} side={"bottom"} sideOffset={5}>
                    <DropdownMenu.Item onClick={() => {
                        modalStore.open(Modals.EditGame, { game });
                    }}>
                        <MdEdit /> Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Item data-danger onClick={() => {
                        modalStore.open(Modals.DeleteWarning, {
                            itemName: game.title,
                            deleteFunction: () => {
                                removeGame(game);
                                modalStore.closeTwo();
                            }
                        });
                    }}>
                        <MdDeleteOutline /> Delete
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

export const PlayfrensModal = observer(({ open, closeModal, game }) => {
    const gameCover = useValidatedImage(game.coverImageURL);
    const handleHide = () => {
        closeModal();
    };
    const handleClickBackground = (e) => {
        if (e.target === e.currentTarget) {
            handleHide();
        }
    };

    return (
        <Dialog.Root open={open} onOpenChange={handleHide}>
            <Dialog.Portal>
                <Dialog.Overlay className="rx-dialog-overlay" />
                <Dialog.Content className="rx-dialog playfrens-modal">
                    <VisuallyHidden><Dialog.Title>{game.title}</Dialog.Title></VisuallyHidden>
                    <VisuallyHidden><Dialog.Description>{"Expanded game card of " + game.title}</Dialog.Description></VisuallyHidden>
                    <div className="pfm-card" style={{ "--bg-url": `url("${gameCover}")` }} />
                    <div className="pfm-container">

                        <div className="pfm-header">
                            <GameOptionsButton game={game} />
                            <p className="pfm-title">
                                {game.title}
                            </p>
                            <button className="icon-button ms-auto" onClick={handleHide}>
                                <OutlinedIcon>
                                    <MdClose />
                                </OutlinedIcon>
                            </button>
                        </div>
                        <div className="sidebar-header-shadow" />

                        <div className="pfm-content">
                            <div className="sidebar pfm-element">
                                <PFMSidebarGroup dataType={dataTypes.friend} game={game} />
                                <div className="sidebar-separator" />
                                <PFMSidebarGroup dataType={dataTypes.category} game={game} />
                                <div className="sidebar-separator" />
                                <PFMSidebarGroup dataType={dataTypes.status} game={game} />
                            </div>

                            <div className="pfm-column">
                                <div className="game-note-container pfm-element">
                                    <div className="sidebar-header">
                                        <div />
                                        <h4>NOTE</h4>
                                        <div />
                                    </div>
                                    <textarea className="game-note" rows={3}
                                              spellCheck={false}
                                              value={game.note}
                                              onChange={(e) => game.setNote(e.target.value)} />
                                </div>

                                <div className="playthroughs-container pfm-element">
                                    <div className="sidebar-header">
                                        <div />
                                        <h4>PLAYTHROUGHS</h4>
                                        <button className="icon-button">
                                            <MdAdd />
                                        </button>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
});