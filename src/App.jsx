import { useState } from "react";
import Form from "react-bootstrap/Form";
import { ToastContainer } from "react-toastify";
import {
    MdClose,
    MdOutlineFileDownload,
    MdOutlineFileUpload,
    MdOutlineGamepad,
    MdPerson,
    MdMenu,
    MdChevronRight,
} from "react-icons/md";
import { backupToFile, restoreFromFile } from "./DataStore.jsx";
import { tagTypes } from "./models/TagTypes.jsx";
import { GamesGrid } from "./components/GameGrid.jsx";
import { SidebarGroup } from "./components/SidebarGroup.jsx";
import { DialogRoot } from "./components/Dialogs/DialogRoot.jsx";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import { Dialogs, dialogStore } from "./components/Dialogs/DialogStore.jsx";
import { useFilterStore } from "./FilterStore.jsx";
import { observer } from "mobx-react-lite";

function AppMenu() {
    const [open, setOpen] = useState(false);
    return (
        <>
            <DropdownMenu.Root onOpenChange={setOpen}>
                <DropdownMenu.Trigger asChild>
                    <button className={"icon-button" + (open ? " open" : "")}>
                        <MdMenu />
                    </button>
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
                    <DropdownMenu.Item>
                        <a href="https://github.com/liranbr/Playfrens" target="_blank">
                            GitHub
                        </a>
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                        <a href="https://trello.com/b/H9Cln6UD/playfrens" target="_blank">
                            Trello
                        </a>
                    </DropdownMenu.Item>
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
        <div className="app-header">
            <AppMenu />
            <div className="app-brand">
                <img
                    src="/Playfrens_Logo.png"
                    alt="Playfrens Logo"
                    width={30}
                    height={30}
                    className="d-inline-block align-top"
                />
                <b> Playfrens</b>
            </div>
            <Form
                inline="true"
                style={{
                    position: "absolute",
                    right: "50%",
                    transform: "translateX(50%)",
                }}
            >
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
                <button
                    type="reset"
                    className="icon-button"
                    onClick={updateSearch}
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
                >
                    <MdClose />
                </button>
            </Form>

            <button className="new-game-button" onClick={() => dialogStore.open(Dialogs.EditGame)}>
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
    );
});

function AppSidebar() {
    return (
        <div className="sidebar">
            <SidebarGroup tagType={tagTypes.friend} tagsList={tagTypes.friend.allTagsList} />
            <div className="sidebar-separator" />
            <SidebarGroup tagType={tagTypes.category} tagsList={tagTypes.category.allTagsList} />
            <div className="sidebar-separator" />
            <SidebarGroup tagType={tagTypes.status} tagsList={tagTypes.status.allTagsList} />
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
