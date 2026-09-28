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

    return (
        <>
            <div className="app-brand-separator" />
            <Dropdown
                trigger={
                    <span className="board-switcher-trigger">
                        <span className="board-switcher-trigger-label">
                            {boardStore.activeBoard?.name ?? "Board"}
                        </span>
                        <MdKeyboardArrowDown />
                    </span>
                }
            >
                {!userInfo.isGuest && (
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
                            <Dropdown.Item
                                onClick={() => globalDialogStore.open(Dialogs.CreateBoard)}
                            >
                                <MdAdd /> New Board
                            </Dropdown.Item>
                        )}
                    </>
                )}
                <Dropdown.Item onClick={() => globalDialogStore.open(Dialogs.BoardSettings)}>
                    <MdSettings /> Board Settings
                </Dropdown.Item>
            </Dropdown>
        </>
    );
});
