import { observer } from "mobx-react-lite";
import { MdKeyboardArrowDown } from "react-icons/md";
import { Dialogs, globalDialogStore, useBoardStore, useUserStore } from "@/stores";
import { Dropdown } from "@/components";

/**
 * Allows users to switch and create boards.
 * Guests cannot create one so this will be overriden with showcasing the name of the board.
 */
export const BoardSwitcher = observer(() => {
    const boardStore = useBoardStore();
    const { userInfo } = useUserStore();

    if (userInfo.isGuest) {
        return (
            <>
                <div className="app-brand-separator" />
                <span className="board-switcher-trigger board-name-static">
                    <span className="board-switcher-trigger-label">
                        {boardStore.activeBoard?.name ?? "Board"}
                    </span>
                </span>
            </>
        );
    }

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
                {boardStore.boards.map((board) => (
                    <Dropdown.Item key={board.id} onClick={() => boardStore.switchBoard(board.id)}>
                        {board.name}
                    </Dropdown.Item>
                ))}
                {boardStore.canCreateBoard && (
                    <>
                        <Dropdown.Separator />
                        <Dropdown.Item onClick={() => globalDialogStore.open(Dialogs.CreateBoard)}>
                            Create board
                        </Dropdown.Item>
                    </>
                )}
            </Dropdown>
        </>
    );
});
