import { useMemo, useState } from "react";
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
import { allGames, backupToFile, restoreFromFile } from "./Store.jsx";
import { tagTypes } from "./models/TagTypes.jsx";
import { GamesGrid } from "./components/GameGrid.jsx";
import { setForceFilterUpdateCallback } from "./Utils.jsx";
import { SidebarGroup } from "./components/SidebarGroup.jsx";
import { DialogRoot } from "./components/Dialogs/DialogRoot.jsx";
import "./App.css";
import "react-toastify/dist/ReactToastify.css";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import { Dialogs, dialogStore } from "./components/Dialogs/DialogStore.jsx";

function AppMenu() {
    const [open, setOpen] = useState(false);
    return (
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
                    <a href="https://trello.com/c/dLSvKuWb/293-app-menu-dropdown" target="_blank">
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
    );
}

function AppHeader({ searchState }) {
    const [search, setSearch] = searchState;
    const updateSearch = (e) => setSearch(e.target.value || "");
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

            <div className="me-auto">
                <input
                    type="file"
                    id="json-selector"
                    accept=".json"
                    style={{ display: "none" }}
                    onChange={(e) => restoreFromFile(e.target.files[0])}
                />

                {/* <Nav.Link
                    draggable="false"
                    href="https://github.com/liranbr/Playfrens"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    GitHub
                </Nav.Link> */}
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
                    className="game-search"
                    style={{ ...(search && { border: "2px solid var(--pf-btn-primary)" }) }}
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
}

function AppSidebar({ setSelectedFriends, setSelectedCategories, setSelectedStatuses }) {
    // 50% height for friend bar, 50% for categories and statuses
    return (
        <div className="sidebar">
            <SidebarGroup
                tagType={tagTypes.friend}
                tagsList={tagTypes.friend.allTagsList}
                setSelection={setSelectedFriends}
            />
            <div className="sidebar-separator" />
            <SidebarGroup
                tagType={tagTypes.category}
                tagsList={tagTypes.category.allTagsList}
                setSelection={setSelectedCategories}
            />
            <div className="sidebar-separator" />
            <SidebarGroup
                tagType={tagTypes.status}
                tagsList={tagTypes.status.allTagsList}
                setSelection={setSelectedStatuses}
            />
        </div>
    );
}

export default function App() {
    const [search, setSearch] = useState("");
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [forceFilterUpdate, setForceFilterUpdate] = useState(0);
    setForceFilterUpdateCallback(() => {
        setForceFilterUpdate((prev) => prev + 1); // used in Utils to trigger a filter update
    });

    // Game Title includes the search value
    // If friends selected, all friends are in the game
    // If categories selected, game belongs to at least one of them
    // If statuses selected, game has at least one of them
    const filteredGames = useMemo(
        () =>
            allGames.filter(
                (game) =>
                    game.title.toLowerCase().includes(search.toLowerCase()) &&
                    selectedFriends.every((friend) => game.friends.includes(friend)) &&
                    (!selectedCategories.length ||
                        selectedCategories.some((category) =>
                            game.categories.includes(category),
                        )) &&
                    (!selectedStatuses.length ||
                        selectedStatuses.some((status) => game.statuses.includes(status))),
            ),
        [search, selectedFriends, selectedCategories, selectedStatuses, forceFilterUpdate],
    );

    return (
        <>
            <AppHeader searchState={[search, setSearch]} />
            <div id="main-content">
                <AppSidebar
                    setSelectedFriends={setSelectedFriends}
                    setSelectedCategories={setSelectedCategories}
                    setSelectedStatuses={setSelectedStatuses}
                />
                <GamesGrid filteredGames={filteredGames} />
            </div>
            <DialogRoot />
            <ToastContainer toastClassName="toast-notification" />
        </>
    );
}
