import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Navigate, useParams } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import * as Popover from "@radix-ui/react-popover";
import {
    MdChevronRight,
    MdClose,
    MdFilterAltOff,
    MdKeyboardArrowDown,
    MdMenu,
    MdOutlineCheckCircle,
    MdOutlineFileDownload,
    MdOutlineFileUpload,
    MdOutlineGamepad,
    MdOutlineNotifications,
    MdPerson,
    MdShare,
} from "react-icons/md";

import { tagTypes, tagTypeStrings } from "@/models";
import {
    backupToFile,
    Dialogs,
    globalDataStore,
    globalDialogStore,
    restoreFromFile,
    useBoardStore,
    useDataStore,
    useFilterStore,
    useUserStore,
} from "@/stores";
import {
    CenterAndEdgesRow,
    DialogRoot,
    GamesGrid,
    IconButton,
    ReminderCard,
    SidebarTagButtonGroup,
    SimpleTooltip,
    ArrowToFeature,
} from "@/components";

import "./Playfrens.css";
import { toastError, toastSuccess } from "@/Utils";

function AppMenu() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const DD = DropdownMenu;
    const LinkItem = ({ label, url }) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
            <DD.Item>{label}</DD.Item>
        </a>
    );
    return (
        <>
            <DD.Root onOpenChange={setDropdownOpen}>
                <DD.Trigger asChild>
                    <IconButton icon={<MdMenu />} activate={dropdownOpen} />
                </DD.Trigger>
                <DD.Portal>
                    <DD.Content
                        className="rx-dropdown-menu"
                        align={"start"}
                        side={"bottom"}
                        sideOffset={5}
                    >
                        <DD.Sub>
                            <DD.Item onClick={() => globalDialogStore.open(Dialogs.BoardSettings)}>
                                Board Settings
                            </DD.Item>
                            <DD.SubTrigger>
                                Backup
                                <MdChevronRight className="rx-dropdown-right-slot" />
                            </DD.SubTrigger>
                            <DD.SubContent className="rx-dropdown-menu" sideOffset={5}>
                                <DD.Item
                                    onClick={() => {
                                        globalDialogStore.open(Dialogs.GenericWarning, {
                                            message:
                                                "Importing a backup will overwrite all of your current data.",
                                            continueFunction: () => {
                                                document.getElementById("json-selector").click();
                                            },
                                        });
                                    }}
                                >
                                    <MdOutlineFileUpload /> Restore
                                </DD.Item>
                                <DD.Item onClick={backupToFile}>
                                    <MdOutlineFileDownload /> Backup
                                </DD.Item>
                            </DD.SubContent>
                        </DD.Sub>
                        <DD.Separator />
                        <DD.Sub>
                            <DD.SubTrigger>
                                Links
                                <MdChevronRight className="rx-dropdown-right-slot" />
                            </DD.SubTrigger>
                            <DD.SubContent className="rx-dropdown-menu" sideOffset={5}>
                                <LinkItem
                                    label="GitHub"
                                    url="https://github.com/liranbr/Playfrens"
                                />
                                <LinkItem label="Discord" url="https://discord.gg/aTdwEGau4Q" />
                                <LinkItem label="Homepage" url="/" />
                            </DD.SubContent>
                        </DD.Sub>
                        <DD.Separator />
                        <LinkItem
                            label="Send feedback"
                            url="mailto:playfrens@proton.me?subject=Feedback"
                        />
                    </DD.Content>
                </DD.Portal>
            </DD.Root>

            <input
                type="file"
                id="json-selector"
                accept=".json"
                style={{ display: "none" }}
                onChange={(e) => restoreFromFile(e.target.files[0])}
            />
        </>
    );
}

/**
 * Allows users to switch and create boards.
 * Members cannot create one so this will be overriden with showcasing the name of the board.
 */
const BoardSwitcher = observer(() => {
    const boardStore = useBoardStore();
    const { userInfo } = useUserStore();
    const DD = DropdownMenu;

    if (userInfo.isGuest) {
        return (
            <>
                <div className="app-brand-separator" />
                <span className="board-switcher-trigger board-name-static">
                    {boardStore.activeBoard?.name ?? "Board"}
                </span>
            </>
        );
    }

    return (
        <>
            <div className="app-brand-separator" />
            <DD.Root>
                <DD.Trigger asChild>
                    <button className="board-switcher-trigger">
                        {boardStore.activeBoard?.name ?? "Board"}
                        <MdKeyboardArrowDown />
                    </button>
                </DD.Trigger>
                <DD.Portal>
                    <DD.Content
                        className="rx-dropdown-menu"
                        align={"start"}
                        side={"bottom"}
                        sideOffset={5}
                    >
                        {boardStore.boards.map((board) => (
                            <DD.Item
                                key={board.id}
                                onClick={() => boardStore.switchBoard(board.id)}
                            >
                                {board.name}
                            </DD.Item>
                        ))}
                        {boardStore.canCreateBoard && (
                            <>
                                <DD.Separator />
                                <DD.Item
                                    onClick={() => globalDialogStore.open(Dialogs.CreateBoard)}
                                >
                                    Create board
                                </DD.Item>
                            </>
                        )}
                    </DD.Content>
                </DD.Portal>
            </DD.Root>
        </>
    );
});

const AppHeader = observer(() => {
    const filterStore = useFilterStore();
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
                <ArrowToFeature enable={globalDataStore.allGames.size === 0}>
                    <button
                        className="new-game-button"
                        onClick={() => globalDialogStore.open(Dialogs.EditGame)}
                    >
                        <MdOutlineGamepad />
                        Add Game
                    </button>
                </ArrowToFeature>

                <Notifications />

                <AppUserAvatar />
            </div>
        </CenterAndEdgesRow>
    );
});

const ShareGamesAsText = observer(() => {
    const { search, selectedTagIDs, excludedTagIDs, areFiltersActive, filteredGames } =
        useFilterStore();
    const { userInfo } = useUserStore();
    const makeFiltersText = () => {
        if (!areFiltersActive) return "**No filters active**";
        const currentFilters = [];
        if (search) currentFilters.push("**Search:** " + search);
        const tagFiltersLine = (tagSets, filterText) => {
            if (Object.values(tagSets).some((set) => set.size > 0)) {
                const selectedTagsText = [];
                for (const tagType in tagSets) {
                    if (tagSets[tagType].size > 0) {
                        const tagPlural = tagTypeStrings[tagType].plural;
                        const tagNames = Array.from(tagSets[tagType]).map(
                            (id) => globalDataStore.getTagByID(id, tagType).name,
                        );
                        selectedTagsText.push(`* ${tagPlural} [${tagNames.join(", ")}]`);
                    }
                }
                currentFilters.push(filterText, ...selectedTagsText);
            }
        };
        tagFiltersLine(selectedTagIDs, "**Selected Tags:**");
        tagFiltersLine(excludedTagIDs, "~~Excluded Tags:~~");

        return currentFilters.join("  \n");
    };
    const makeGamesText = (withLinks) => {
        const currentGames = [`### ${filteredGames.length} Games`];
        filteredGames.forEach((game) => {
            // If it's a steam game, format the title as a link to its store page
            if (withLinks && !!game.storeID && game.storeType === "steam") {
                const steamLink = "https://s.team/a/" + game.storeID; // using official s.team shortener to fit more games in one message
                currentGames.push("* [" + game.title + "](<" + steamLink + ">)");
            } else currentGames.push("* " + game.title);
        });

        return currentGames.join("  \n");
    };
    const handleCopy = async (withLinks) => {
        const pfLink = "https://playfrens.com/";
        try {
            const text = [
                `## ${userInfo.displayName}'s [Playfrens](<${pfLink}>) Board`,
                makeFiltersText(),
                makeGamesText(withLinks),
            ].join("  \n");
            await navigator.clipboard.writeText(text);
            toastSuccess("Copied to clipboard!");
        } catch (err) {
            const errMsg = "Failed to copy text: " + err;
            console.error(errMsg);
            toastError(errMsg);
        }
    };

    const DD = DropdownMenu;
    return (
        <DD.Root>
            <SimpleTooltip message="Share current games">
                <DD.Trigger asChild>
                    <IconButton icon={<MdShare />} onClick={handleCopy} />
                </DD.Trigger>
            </SimpleTooltip>
            <DD.Portal>
                <DD.Content
                    className="rx-dropdown-menu"
                    align={"start"}
                    side={"bottom"}
                    sideOffset={5}
                >
                    <DD.Item onClick={() => handleCopy(true)}>Share as text</DD.Item>
                    <DD.Item onClick={() => handleCopy(false)}>Share as text without links</DD.Item>
                </DD.Content>
            </DD.Portal>
        </DD.Root>
    );
});

const AppUserAvatar = observer(() => {
    const userStore = useUserStore();
    const { userInfo } = userStore;
    localStorage.setItem("last-auth-used", JSON.stringify(userInfo.provider, null, 4));
    const DD = DropdownMenu;
    return (
        <DD.Root>
            <DD.Trigger asChild className="rx-avatar">
                <Avatar.Root>
                    <Avatar.Image
                        src={userInfo?.avatar ?? undefined}
                        referrerPolicy="no-referrer"
                    />
                    <Avatar.Fallback className="rx-avatarless" asChild>
                        <MdPerson />
                    </Avatar.Fallback>
                </Avatar.Root>
            </DD.Trigger>
            <DD.Portal>
                <DD.Content
                    className="rx-dropdown-menu"
                    align={"start"}
                    side={"bottom"}
                    sideOffset={5}
                >
                    {!userInfo.isGuest && (
                        <DD.Item onClick={() => globalDialogStore.open(Dialogs.SteamImport)}>
                            Import from Steam
                        </DD.Item>
                    )}
                    <DD.Item onClick={() => globalDialogStore.open(Dialogs.AccountSettings)}>
                        Account Settings
                    </DD.Item>
                    <DD.Item onClick={() => userStore.logout()}>Logout</DD.Item>
                </DD.Content>
            </DD.Portal>
        </DD.Root>
    );
});

const Notifications = observer(() => {
    const timeoutDuration = 15 * 60 * 1000; // Every 15 minutes, check whether reminders have activated to update the badge
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => forceUpdate((n) => n + 1), timeoutDuration);
        return () => clearInterval(interval);
    });

    const [popoverOpen, setPopoverOpen] = useState(false);
    const dataStore = useDataStore();
    const reminders = dataStore.sortedReminders;

    const now = new Date();
    const activeRemindersCount = reminders.filter((r) => r.date < now).length;

    return (
        <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
            <Popover.Trigger asChild>
                <button className={"notifications-button" + (popoverOpen ? " activated" : "")}>
                    {activeRemindersCount > 0 && (
                        <span className="notifications-badge">{activeRemindersCount}</span>
                    )}
                    <MdOutlineNotifications />
                </button>
            </Popover.Trigger>
            <Popover.Content className="rx-popover notifications-drawer" align="end" sideOffset={5}>
                <div className="reminders-list">
                    {reminders.length === 0 ? (
                        <div className="no-reminders">
                            <MdOutlineCheckCircle />
                            You have no reminders.
                        </div>
                    ) : (
                        reminders.map((reminder) => (
                            <ReminderCard key={reminder.id} reminder={reminder} outsideOfGamePage />
                        ))
                    )}
                </div>
            </Popover.Content>
        </Popover.Root>
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
    const { shortId } = useParams();

    // switch if it names a different board you
    useEffect(() => {
        if (!shortId || boardStore.loading) return;
        const board = boardStore.boards.find((b) => b.shortId === shortId || b.id === shortId);
        if (!board || board.id === boardStore.activeBoardId) return;
        boardStore.switchBoard(board.id);
    }, [shortId, boardStore, boardStore.loading, boardStore.boards, boardStore.activeBoardId]);

    if (loading) return <div className="loading-page">Loading...</div>;
    // Requires login, and carries the board id along so signing in lands back on it.
    if (userInfo === undefined) {
        return <Navigate to={shortId ? `/login?board=${shortId}` : "/login"} replace />;
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
