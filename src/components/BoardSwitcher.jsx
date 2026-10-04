import { observer } from "mobx-react-lite";
import { MdAdd, MdKeyboardArrowDown, MdSettings } from "react-icons/md";
import { Dialogs, globalDialogStore, useBoardStore, useUserStore } from "@/stores";
import { Dropdown } from "@/components";

/**
 * Allows users to manage current boards setting and switch to other ones.
 * For Guests, this only shows Board Settings which they can view, but cannot edit.
 */
export const BoardSwitcher = observer(() => {
    const boardStore = useBoardStore();
    const { userInfo } = useUserStore();
    const canSwitch = userInfo && !userInfo.isGuest;
    const boardName = boardStore.activeBoard?.name ?? "Board";

    // Public viewer with nothing to switch to or manage
    if (!canSwitch && boardStore.isReadOnly) {
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
            {canSwitch && (
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
            {!boardStore.isReadOnly && (
                <Dropdown.Item onClick={() => globalDialogStore.open(Dialogs.BoardSettings)}>
                    <MdSettings /> Board Settings
                </Dropdown.Item>
            )}
        </Dropdown>
    );
});
