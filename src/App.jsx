import { useState } from "react";
import Form from "react-bootstrap/Form";
import { ToastContainer } from "react-toastify";
import {
    MdChevronRight,
    MdClose,
    MdMenu,
    MdOutlineFileDownload,
    MdOutlineFileUpload,
    MdOutlineGamepad,
    MdPerson,
} from "react-icons/md";
import { backupToFile, restoreFromFile } from "./stores/DataStore.jsx";
import { tagTypes } from "./models/TagTypes.jsx";
import { GamesGrid } from "./components/GameGrid.jsx";
import { SidebarGroup } from "./components/SidebarGroup.jsx";
import { DialogRoot } from "./components/Dialogs/DialogRoot.jsx";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import { Dialogs, dialogStore } from "./components/Dialogs/DialogStore.jsx";
import { useFilterStore } from "./stores/FilterStore.jsx";
import { observer } from "mobx-react-lite";
import { IconButton } from "./components/common/IconButton.jsx";
import { CenterAndEdgesRow } from "./components/common/CenterAndEdgesRow.jsx";

function AppMenu() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <DropdownMenu.Root onOpenChange={setOpen}>
                <DropdownMenu.Trigger asChild>
                    <IconButton icon={<MdMenu />} activate={open} />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content
                    className="rx-dropdown-menu"
                    align={"start"}
                    side={"bottom"}
                    sideOffset={5}
                >
                    <DropdownMenu.Sub>
                        <DropdownMenu.SubTrigger>
                            File{" "}
                            <div className="rx-dropdown-right-slot">
                                <MdChevronRight />
                            </div>
                        </DropdownMenu.SubTrigger>
                        <DropdownMenu.Portal>
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
                        </DropdownMenu.Portal>
                    </DropdownMenu.Sub>
                    <DropdownMenu.Separator />
                    <a href="https://github.com/liranbr/Playfrens" target="_blank">
                        <DropdownMenu.Item>GitHub</DropdownMenu.Item>
                    </a>
                    <a href="https://trello.com/b/H9Cln6UD/playfrens" target="_blank">
                        <DropdownMenu.Item>Trello</DropdownMenu.Item>
                    </a>
                    <DropdownMenu.Item onClick={() => dialogStore.open(Dialogs.Settings)}>
                        Settings
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => dialogStore.open(Dialogs.About)}>
                        About
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
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
                    <img src="/Playfrens_Logo.png" alt="Playfrens Logo" width={30} height={30} />
                    <b> Playfrens</b>
                </div>
            </div>

            {/*TODO: Replace this whole form + reset button*/}
            <div>
                <Form inline="true" className="flex-row align-items-center justify-content-center">
                    <Form.Control
                        type="text"
                        placeholder="Search"
                        value={search}
                        onChange={updateSearch}
                        className={"game-search" + (search ? " has-value" : "")}
                        autoComplete="off"
                        onKeyDown={(e) => (e.key === "Enter" ? e.preventDefault() : null)}
                        onSubmit={(e) => e.preventDefault()}
                    />
                    {/*TODO: improve here when removing bootstrap*/}
                    <IconButton
                        icon={<MdClose />}
                        onClick={updateSearch}
                        type="reset"
                        style={{
                            display: search ? "flex" : "none",
                            position: "absolute",
                            fontSize: "20px",
                            right: "0",
                            top: "50%",
                            transform: "translateY(-50%)",
                            border: "none",
                            background: "none",
                            alignItems: "center",
                        }}
                    />
                </Form>
            </div>

            <div>
                <button
                    className="new-game-button"
                    onClick={() => dialogStore.open(Dialogs.EditGame)}
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
                <SidebarGroup tagType={tagTypes.friend} />
                <div className="separator" />
                <SidebarGroup tagType={tagTypes.category} />
                <div className="separator" />
                <SidebarGroup tagType={tagTypes.status} />
            </div>
        </div>
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
            <ToastContainer toastClassName="toast-notification" />
        </>
    );
}
