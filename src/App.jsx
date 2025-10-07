import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { ToastContainer } from "react-toastify";
import * as Tooltip from "@radix-ui/react-tooltip";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import { toJS } from "mobx"
import {
    MdChevronRight,
    MdClose,
    MdFilterAltOff,
    MdMenu,
    MdOutlineFileDownload,
    MdOutlineFileUpload,
    MdOutlineGamepad,
    MdPerson,
} from "react-icons/md";
import { tagTypes } from "@/models";
import {
    useFilterStore,
    backupToFile,
    restoreFromFile,
    Dialogs,
    globalDialogStore,
    useUserStore
} from "@/stores";
import {
    SidebarTagButtonGroup,
    IconButton,
    CenterAndEdgesRow,
    GamesGrid,
    SimpleTooltip,
} from "@/components";
import { DialogRoot } from "@/components/Dialogs/DialogRoot.jsx";
import "./App.css";

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
                                        document.getElementById("json-selector").click();
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
                        <a href="https://github.com/liranbr/Playfrens" target="_blank">
                            <DD.Item>GitHub</DD.Item>
                        </a>
                        <a href="https://trello.com/b/H9Cln6UD/playfrens" target="_blank">
                            <DD.Item>Trello</DD.Item>
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
                <div />
            </CenterAndEdgesRow>

            <div>
                <button
                    className="new-game-button"
                    onClick={() => globalDialogStore.open(Dialogs.EditGame)}
                >
                    <MdOutlineGamepad />
                    Add Game
                </button>
                <AppUserAvatar />
            </div>
        </CenterAndEdgesRow>
    );
});

const AppUserAvatar = observer(() => {
    const userStore = useUserStore();
    const { userInfo } = userStore;
    return (<SimpleTooltip message="Accounts not implemented yet">
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild className="rx-avatar">
                <Avatar.Root>
                    <Avatar.Image src={userInfo?.avatars?.[0] ?? undefined} />
                    <Avatar.Fallback className="rx-avatarless" asChild>
                        <MdPerson />
                    </Avatar.Fallback>
                </Avatar.Root>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="rx-dropdown-menu"
                    align={"start"}
                    side={"bottom"}
                    sideOffset={5}
                >
                    {
                        !userInfo &&
                        <DropdownMenu.Item onClick={() => userStore.login()}>
                            Login
                        </DropdownMenu.Item>
                    }
                    {
                        userInfo &&
                        <DropdownMenu.Item onClick={() => userStore.logout()}>
                            Logout
                        </DropdownMenu.Item>
                    }
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>

    </SimpleTooltip>);
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

export default function App() {
    useScrollbarMeasure();

    return (
        <Tooltip.Provider delayDuration={750} disableHoverableContent={true}>
            <AppHeader />
            <div id="main-content">
                <AppSidebar />
                <GamesGrid />
            </div>
            <DialogRoot />
            <ToastRoot />
        </Tooltip.Provider>
    );
}
