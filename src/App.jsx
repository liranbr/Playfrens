import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { ToastContainer } from "react-toastify";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import * as Popover from "@radix-ui/react-popover";
import {
    MdChevronRight,
    MdClose,
    MdFilterAltOff,
    MdMenu,
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
} from "@/components";
import { Contact, Home, Login, Privacy } from "@/pages";

import "./App.css";
import { toastError, toastSuccess } from "@/Utils.jsx";

function AppMenu() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const DD = DropdownMenu;
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
                            <DD.SubTrigger>
                                File
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
                        <a
                            href="https://github.com/liranbr/Playfrens"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <DD.Item>GitHub</DD.Item>
                        </a>
                        <a
                            href="https://discord.gg/aTdwEGau4Q"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <DD.Item>Discord</DD.Item>
                        </a>
                        <DD.Item onClick={() => globalDialogStore.open(Dialogs.Settings)}>
                            Settings
                        </DD.Item>
                        <DD.Item onClick={() => globalDialogStore.open(Dialogs.About)}>
                            About
                        </DD.Item>
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

const AppHeader = observer(() => {
    const filterStore = useFilterStore();
    const search = filterStore.search;
    const updateSearch = (e) => filterStore.setSearch(e.target.value);

    return (
        <CenterAndEdgesRow className="app-header">
            <div>
                <AppMenu />
                <div className="app-brand">
                    <img src="/Playfrens_Logo.png" alt="Playfrens Logo" />
                    Playfrens
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
                <button
                    className="new-game-button"
                    onClick={() => globalDialogStore.open(Dialogs.EditGame)}
                >
                    <MdOutlineGamepad />
                    Add Game
                </button>

                <Notifications />

                <AppUserAvatar />
            </div>
        </CenterAndEdgesRow>
    );
});

const ShareGamesAsText = observer(() => {
    const { search, selectedTagIDs, excludedTagIDs, areFiltersActive, filteredGames } =
        useFilterStore();
    const makeFiltersText = () => {
        if (!areFiltersActive) return "**No filters active**";
        const currentFilters = [];
        if (search) currentFilters.push("**Search:** " + search);
        const tagFiltersLine = (tagSets, filterText) => {
            if (Object.values(tagSets).some((set) => set.size > 0)) {
                const selectedTagsText = [];
                for (const tagType in tagSets) {
                    if (tagSets[tagType].size > 0) {
                        const tagNames = Array.from(tagSets[tagType]).map(
                            (id) => globalDataStore.getTagByID(id, tagType).name,
                        );
                        selectedTagsText.push(
                            tagTypeStrings[tagType].plural + "[" + tagNames.join(", ") + "]",
                        );
                    }
                }
                currentFilters.push(filterText + selectedTagsText.join(", "));
            }
        };
        tagFiltersLine(selectedTagIDs, "**Selected Tags:** ");
        tagFiltersLine(excludedTagIDs, "**Excluded Tags:** ");

        return currentFilters.join("  \n");
    };
    const makeGamesText = (withLinks) => {
        const currentGames = [`### ${filteredGames.length} Games`];
        filteredGames.forEach((game) => {
            // If it's a steam game, format the title as a link to its store page
            if (withLinks && !!game.storeID && game.storeType === "steam") {
                const steamLink = "https://store.steampowered.com/app/" + game.storeID + "/";
                currentGames.push("* [" + game.title + "](<" + steamLink + ">)");
            } else currentGames.push("* " + game.title);
        });

        return currentGames.join("  \n");
    };
    const handleCopy = async (withLinks) => {
        try {
            const text =
                "## Playfrens Board\n" + makeFiltersText() + "  \n" + makeGamesText(withLinks);
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
    const DD = DropdownMenu;
    return (
        <DD.Root>
            <DD.Trigger asChild className="rx-avatar">
                <Avatar.Root>
                    <Avatar.Image src={userInfo?.avatar ?? undefined} />
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
                    {userInfo.provider === "steam" && (
                        <DD.Item onClick={() => globalDialogStore.open(Dialogs.SteamImport)}>
                            Import from Steam
                        </DD.Item>
                    )}
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
                    {reminders.map((reminder) => (
                        <ReminderCard key={reminder.id} reminder={reminder} outsideOfGamePage />
                    ))}
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

function ToastRoot() {
    return (
        <ToastContainer
            position="bottom-center"
            autoClose={3000}
            closeButton={false}
            hideProgressBar={true}
            closeOnClick={true}
            pauseOnHover={true}
            draggable={true}
            progress={undefined}
            theme="dark"
            toastClassName="toast-notification"
        />
    );
}

function useScrollbarMeasure() {
    // This measures the width of the user's scrollbar, which varies between OSs and browsers.
    // It then sets this px value as a global CSS variable, used wherever a scrollbar is expected with centered content.
    useEffect(() => {
        function measureScrollbar() {
            const outer = document.createElement("div");
            outer.style.visibility = "hidden";
            outer.style.overflow = "scroll";
            outer.style.position = "absolute";
            outer.style.top = "-9999px";
            document.body.appendChild(outer);
            const inner = document.createElement("div");
            outer.appendChild(inner);

            let width = outer.offsetWidth - inner.offsetWidth;
            if (width > 11) width = 8; // means 'thin scrollbar' CSS hasn't fully loaded when measuring. Let's guess instead of causing shifting through rerenders.
            outer.remove();
            document.documentElement.style.setProperty("--scrollbar-width", `${width}px`);
        }

        measureScrollbar();
        // Measure initially, and re-measure on zoom change. Mounted on the root App().
        let lastRatio = window.devicePixelRatio;
        window.addEventListener("resize", () => {
            if (window.devicePixelRatio !== lastRatio) {
                lastRatio = window.devicePixelRatio;
                measureScrollbar();
            }
        });
    }, []);
}

const Playfrens = observer(() => {
    const userStore = useUserStore();
    const { loading, userInfo } = userStore;
    useEffect(() => {
        const checkEvery = 5 * 60 * 1000; // Check connection every 5 minutes
        const intervalId = setInterval(() => userStore.getUser(), checkEvery);
        return () => clearInterval(intervalId);
    }, []);

    if (loading) return <div className="loading-page">Loading...</div>;
    if (userInfo === undefined) return <Navigate to="/login" replace />;

    // 'Protected Route' requires the user be logged in
    return (
        <>
            <AppHeader />
            <div id="main-content">
                <AppSidebar />
                <GamesGrid />
            </div>
            <DialogRoot />
            <ToastRoot />
        </>
    );
});

export default function App() {
    useScrollbarMeasure();

    return (
        <Tooltip.Provider delayDuration={750}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/app" element={<Playfrens />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<Privacy />} />
                </Routes>
            </BrowserRouter>
        </Tooltip.Provider>
    );
}
