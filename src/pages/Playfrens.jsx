import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Link, Navigate, useParams } from "react-router-dom";
import * as Avatar from "@radix-ui/react-avatar";
import {
    MdChevronRight,
    MdClose,
    MdFilterAltOff,
    MdMenu,
    MdOutlineFileDownload,
    MdOutlineFileUpload,
    MdOutlineGamepad,
    MdOutlineVisibility,
    MdPerson,
} from "react-icons/md";

import { tagTypes } from "@/models";
import { pickFile } from "@/Utils";
import {
    backupToFile,
    Dialogs,
    globalDataStore,
    globalDialogStore,
    restoreFromFile,
    useBoardStore,
    useFilterStore,
    useUserStore,
} from "@/stores";
import {
    ArrowToFeature,
    BoardSwitcher,
    CenterAndEdgesRow,
    DialogRoot,
    Dropdown,
    GamesGrid,
    IconButton,
    Notifications,
    ShareGamesAsText,
    SidebarTagButtonGroup,
    SimpleTooltip,
} from "@/components";
import { guestLinkToken } from "@/services/GuestLinkToken.js";

import "./Playfrens.css";

const AppMenu = observer(() => {
    const boardStore = useBoardStore();
    const { userInfo } = useUserStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const isViewer = boardStore.isReadOnly;
    return (
        <Dropdown
            trigger={<IconButton icon={<MdMenu />} activate={dropdownOpen} />}
            onOpenChange={setDropdownOpen}
        >
            {!isViewer && !userInfo.isGuest && (
                <Dropdown.Item onClick={() => globalDialogStore.open(Dialogs.SteamImport)}>
                    Import from Steam
                </Dropdown.Item>
            )}
            {!isViewer && (
                <Dropdown.Sub>
                    <Dropdown.SubTrigger>
                        Backup
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
            {!isViewer && <Dropdown.Separator />}
            <Dropdown.Sub>
                <Dropdown.SubTrigger>
                    Links
                    <MdChevronRight className="rx-dropdown-right-slot" />
                </Dropdown.SubTrigger>
                <Dropdown.SubContent>
                    <Dropdown.LinkItem label="GitHub" url="https://github.com/liranbr/Playfrens" />
                    <Dropdown.LinkItem label="Discord" url="https://discord.gg/aTdwEGau4Q" />
                    <Dropdown.LinkItem label="Homepage" url="/" />
                </Dropdown.SubContent>
            </Dropdown.Sub>
            <Dropdown.Separator />
            <Dropdown.LinkItem
                label="Send feedback"
                url="mailto:playfrens@proton.me?subject=Feedback"
            />
        </Dropdown>
    );
});

const AppHeader = observer(() => {
    const filterStore = useFilterStore();
    const boardStore = useBoardStore();
    const { userInfo } = useUserStore();
    const search = filterStore.search;
    const updateSearch = (e) => filterStore.setSearch(e.target.value);

    return (
        <CenterAndEdgesRow className="app-header">
            <div className="app-header-left">
                <AppMenu />
                <div className="app-brand-row">
                    <div className="app-brand">
                        <img src="/Playfrens_Logo.png" alt="Playfrens Logo" />
                        Playfrens
                    </div>
                    <div className="app-brand-separator" />
                    <BoardSwitcher />
                </div>
            </div>

            <CenterAndEdgesRow className="app-header-center">
                <SimpleTooltip message="Reset filters" delayDuration={300}>
                    <IconButton
                        icon={<MdFilterAltOff />}
                        style={{
                            visibility: filterStore.areFiltersActive ? "visible" : "hidden",
                            transition: "visibility 0s",
                        }}
                        onClick={() => filterStore.resetFilters()}
                    />
                </SimpleTooltip>
                <div className={"game-search" + (search ? " has-value" : "")}>
                    <input value={search} onChange={updateSearch} placeholder="Search" />
                    <IconButton icon={<MdClose />} type="reset" onClick={updateSearch} />
                </div>
                <ShareGamesAsText />
            </CenterAndEdgesRow>

            <div className="app-header-right">
                {boardStore.isOwner && (
                    <ArrowToFeature enable={globalDataStore.allGames.size === 0}>
                        <button
                            className="new-game-button"
                            onClick={() => globalDialogStore.open(Dialogs.EditGame)}
                        >
                            <MdOutlineGamepad />
                            Add Game
                        </button>
                    </ArrowToFeature>
                )}

                {boardStore.isReadOnly && <ReadOnlyBadge />}
                {userInfo?.isGuest && <GuestBadge />}
                <Notifications />

                <AppUserAvatar />
            </div>
        </CenterAndEdgesRow>
    );
});

const ReadOnlyBadge = observer(() => {
    const { activeBoard } = useBoardStore();
    return (
        <SimpleTooltip
            message={`You're viewing ${activeBoard?.ownerName}'s board. Only its members can make changes.`}
        >
            <div className="read-only-badge">
                <MdOutlineVisibility />
                Read Only
            </div>
        </SimpleTooltip>
    );
});

const GuestBadge = observer(() => {
    return (
        <SimpleTooltip
            message={`Your account was made by the owner of this board. Create an account to create your own boards.`}
        >
            <div className="guest-badge">
                <MdOutlineVisibility />
                Guest
            </div>
        </SimpleTooltip>
    );
});

const AppUserAvatar = observer(() => {
    const userStore = useUserStore();
    const { userInfo } = userStore;
    const boardStore = useBoardStore();

    // Logged out public viewer, logging in brings them back to this board
    if (!userInfo) {
        const shortId = boardStore.activeBoard?.shortId;
        return (
            <Link className="log-in-button" to={shortId ? `/login?board=${shortId}` : "/login"}>
                Log in
            </Link>
        );
    }
    localStorage.setItem("last-auth-used", JSON.stringify(userInfo.provider, null, 4));

    return (
        <Dropdown
            trigger={
                <Avatar.Root>
                    <Avatar.Image
                        src={userInfo?.avatar ?? undefined}
                        referrerPolicy="no-referrer"
                    />
                    <Avatar.Fallback className="rx-avatarless" asChild>
                        <MdPerson />
                    </Avatar.Fallback>
                </Avatar.Root>
            }
            triggerClassName="rx-avatar"
        >
            <Dropdown.Item onClick={() => globalDialogStore.open(Dialogs.AccountSettings)}>
                Account Settings
            </Dropdown.Item>
            <Dropdown.Item onClick={() => userStore.logout()}>Logout</Dropdown.Item>
        </Dropdown>
    );
});

function AppSidebar() {
    return (
        <div className="app-sidebar-container">
            <div className="ui-card">
                <SidebarTagButtonGroup tagType={tagTypes.friend} />
                <div className="separator" />
                <SidebarTagButtonGroup tagType={tagTypes.category} />
                <div className="separator" />
                <SidebarTagButtonGroup tagType={tagTypes.status} />
            </div>
        </div>
    );
}

const Playfrens = observer(() => {
    const userStore = useUserStore();
    const { loading, userInfo } = userStore;
    const boardStore = useBoardStore();
    const { shortId, guestName } = useParams();

    // switch if it names a different board you
    useEffect(() => {
        if (!shortId || boardStore.loading) return;
        const board = boardStore.boards.find((b) => b.shortId === shortId || b.id === shortId);
        if (!board || board.id === boardStore.activeBoardId) return;
        boardStore.switchBoard(board.id);
    }, [shortId, boardStore, boardStore.loading, boardStore.boards, boardStore.activeBoardId]);

    // Guest login links are handled on the login page.
    if (shortId && guestLinkToken) return <Navigate to={`/login?board=${shortId}`} replace />;
    if (loading) return <div className="loading-page">Loading...</div>;
    // Requires login (unless it's a public board), and carries the board id along so signing in lands back on it.
    // Guest login links always go to login, even when the board is public.
    if (userInfo === undefined && (!boardStore.isReadOnly || guestName)) {
        if (!shortId) return <Navigate to="/login" replace />;
        const guestQuery = guestName ? `&guest=${encodeURIComponent(guestName)}` : "";
        return <Navigate to={`/login?board=${shortId}${guestQuery}`} replace />;
    }

    return (
        <>
            <AppHeader />
            <div id="main-content">
                <AppSidebar />
                <GamesGrid />
            </div>
            <DialogRoot />
        </>
    );
});

export default Playfrens;
