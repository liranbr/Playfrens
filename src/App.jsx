import { useState } from "react";
import { observer } from "mobx-react-lite";
import { ToastContainer } from "react-toastify";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
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
} from "@/stores";
import { SidebarTagButtonGroup, IconButton, CenterAndEdgesRow, GamesGrid } from "@/components";
import { DialogRoot } from "@/components/Dialogs/DialogRoot.jsx";
import "./App.css";

function AppMenu() {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    return (
        <>
            <DropdownMenu.Root onOpenChange={setDropdownOpen}>
                <DropdownMenu.Trigger asChild>
                    <IconButton icon={<MdMenu />} activate={dropdownOpen} />
                </DropdownMenu.Trigger>
                <DropdownMenu.Portal>
                    <DropdownMenu.Content
                        className="rx-dropdown-menu"
                        align={"start"}
                        side={"bottom"}
                        sideOffset={5}
                    >
                        <DropdownMenu.Sub>
                            <DropdownMenu.SubTrigger>
                                File
                                <MdChevronRight className="rx-dropdown-right-slot" />
                            </DropdownMenu.SubTrigger>
                            <DropdownMenu.SubContent className="rx-dropdown-menu" sideOffset={5}>
                                <DropdownMenu.Item
                                    onClick={() => {
                                        document.getElementById("json-selector").click();
                                    }}
                                >
                                    <MdOutlineFileUpload /> Restore
                                </DropdownMenu.Item>
                                <DropdownMenu.Item onClick={backupToFile}>
                                    <MdOutlineFileDownload /> Backup
                                </DropdownMenu.Item>
                            </DropdownMenu.SubContent>
                        </DropdownMenu.Sub>
                        <DropdownMenu.Separator />
                        <a href="https://github.com/liranbr/Playfrens" target="_blank">
                            <DropdownMenu.Item>GitHub</DropdownMenu.Item>
                        </a>
                        <a href="https://trello.com/b/H9Cln6UD/playfrens" target="_blank">
                            <DropdownMenu.Item>Trello</DropdownMenu.Item>
                        </a>
                        <DropdownMenu.Item onClick={() => globalDialogStore.open(Dialogs.Settings)}>
                            Settings
                        </DropdownMenu.Item>
                        <DropdownMenu.Item onClick={() => globalDialogStore.open(Dialogs.About)}>
                            About
                        </DropdownMenu.Item>
                    </DropdownMenu.Content>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>

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
                <IconButton
                    icon={<MdFilterAltOff />}
                    style={{
                        visibility: filterStore.areFiltersActive ? "visible" : "hidden",
                        transition: "visibility 0s",
                    }}
                    onClick={() => filterStore.resetFilters()}
                />
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

                <Avatar.Root className="rx-avatar">
                    <Avatar.Image />
                    <Avatar.Fallback>
                        <MdPerson />
                    </Avatar.Fallback>
                </Avatar.Root>
            </div>
        </CenterAndEdgesRow>
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

export default function App() {
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
}
