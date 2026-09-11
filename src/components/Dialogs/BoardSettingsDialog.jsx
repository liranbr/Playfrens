import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Button } from "@/components";
import { DialogBase } from "./DialogRoot.jsx";
import { GeneralTab } from "./BoardSettingsDialog/GeneralTab.jsx";
import { MembersTab } from "./BoardSettingsDialog/MembersTab.jsx";
import { SidebarTab } from "./BoardSettingsDialog/SidebarTab.jsx";
import { GamesGridTab } from "./BoardSettingsDialog/GamesGridTab.jsx";
import { FiltersTab } from "./BoardSettingsDialog/FiltersTab.jsx";
import "./BoardSettingsDialog.css";

const BoardSettingsTabs = {
    general: { label: "General", Component: GeneralTab },
    members: { label: "Members", Component: MembersTab },
    sidebar: { label: "Sidebar", Component: SidebarTab },
    grid: { label: "Games Grid", Component: GamesGridTab },
    filters: { label: "Filters", Component: FiltersTab },
};

export const BoardSettingsDialog = ({ open, closeDialog }) => {
    const [activeTab, setActiveTab] = useState(Object.keys(BoardSettingsTabs)[0]);
    const ActiveTabComponent = BoardSettingsTabs[activeTab].Component;

    return (
        <DialogBase
            open={open}
            onOpenChange={closeDialog}
            contentProps={{
                className: "rx-dialog board-settings-dialog",
                onOpenAutoFocus: (e) => {
                    e.preventDefault(); // Focuses the dialog content instead of the first interactable element
                    e.target.focus();
                },
            }}
        >
            <Dialog.Title>Board Settings</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>
                    Manage this board&apos;s name, members, access, and display settings
                </Dialog.Description>
            </VisuallyHidden>

            <ToggleGroup.Root
                type="single"
                className="rx-toggle-group board-settings-tabs"
                value={activeTab}
                onValueChange={(tab) => tab && setActiveTab(tab)} // to avoid empty values
            >
                {Object.keys(BoardSettingsTabs).map((tab) => (
                    <ToggleGroup.Item value={tab} key={tab}>
                        {BoardSettingsTabs[tab].label}
                    </ToggleGroup.Item>
                ))}
            </ToggleGroup.Root>

            <div className="board-settings-dialog-body">
                <ActiveTabComponent closeDialog={closeDialog} />
            </div>

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
};
