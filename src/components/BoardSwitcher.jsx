import { observer } from "mobx-react-lite";
import {
    MdAdd,
    MdChevronRight,
    MdKeyboardArrowDown,
    MdOutlineFileDownload,
    MdOutlineFileUpload,
    MdSave,
    MdSettings,
} from "react-icons/md";
import {
    backupToFile,
    Dialogs,
    globalDialogStore,
    restoreFromFile,
    useBoardStore,
    useUserStore,
} from "@/stores";
import { Dropdown } from "@/components";
import { pickFile } from "@/Utils.js";

/**
 * Allows users to manage current boards setting and switch to other ones.
 * For Guests, this only shows Board Settings which they can view, but cannot edit.
 */
export const BoardSwitcher = observer(() => {
    const boardStore = useBoardStore();
    const { userInfo } = useUserStore();
    const isAccount = userInfo && !userInfo.isGuest;
    const isViewer = boardStore.isReadOnly;
    const boardName = boardStore.activeBoard?.name ?? "Board";

    // Public viewer with nothing to switch to or manage
    if (isViewer) {
        return (
            <span className="board-switcher-trigger">
                <span className="board-switcher-trigger-label">{boardName}</span>
            </span>
        );
    }

    return (
        <Dropdown
            trigger={
                <span className="board-switcher-trigger">
                    <span className="board-switcher-trigger-label">{boardName}</span>
                    <MdKeyboardArrowDown />
                </span>
            }
        >
            {isAccount && (
                <>
                    {boardStore.boards.map((board) => (
                        <Dropdown.Item
                            key={board.id}
                            data-selected={board.id === boardStore.activeBoardId || undefined}
                            onClick={() => boardStore.switchBoard(board.id)}
                        >
                            {board.name}
                        </Dropdown.Item>
                    ))}
                    <Dropdown.Separator />
                    {boardStore.canCreateBoard && (
                        <Dropdown.Item onClick={() => globalDialogStore.open(Dialogs.CreateBoard)}>
                            <MdAdd /> New Board
                        </Dropdown.Item>
                    )}
                </>
            )}
            <Dropdown.Item onClick={() => globalDialogStore.open(Dialogs.BoardSettings)}>
                <MdSettings /> Board Settings
            </Dropdown.Item>
            {!isViewer && (
                <Dropdown.Sub>
                    <Dropdown.SubTrigger>
                        <MdSave /> Backup
                        <MdChevronRight className="rx-dropdown-right-slot" />
                    </Dropdown.SubTrigger>
                    <Dropdown.SubContent>
                        <Dropdown.Item
                            disabled={!boardStore.isOwner}
                            onSelect={() => {
                                globalDialogStore.open(Dialogs.GenericWarning, {
                                    message:
                                        "Importing a backup will overwrite all of your current data.",
                                    continueFunction: () => pickFile(restoreFromFile, ".json"),
                                });
                            }}
                        >
                            <MdOutlineFileUpload /> Restore
                        </Dropdown.Item>
                        <Dropdown.Item onClick={backupToFile}>
                            <MdOutlineFileDownload /> Backup
                        </Dropdown.Item>
                    </Dropdown.SubContent>
                </Dropdown.Sub>
            )}
        </Dropdown>
    );
});
