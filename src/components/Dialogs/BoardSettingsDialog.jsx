import { useState } from "react";
import { observer } from "mobx-react-lite";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Button } from "@/components";
import { globalBoardStore } from "@/stores";
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
    sidebar: { label: "Sidebar", Component: SidebarTab, ownerOnly: true },
    grid: { label: "Games Grid", Component: GamesGridTab, ownerOnly: true },
    filters: { label: "Filters", Component: FiltersTab, ownerOnly: true },
};

export const BoardSettingsDialog = observer(({ open, closeDialog }) => {
    const isOwner = globalBoardStore.isOwner;
    const [activeTab, setActiveTab] = useState(Object.keys(BoardSettingsTabs)[0]);
    const activeTabInfo = BoardSettingsTabs[activeTab];
    const ActiveTabComponent = activeTabInfo.Component;
    const readOnly = !isOwner && activeTabInfo.ownerOnly;

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
                {readOnly && <p className="dialog-callout">Only the owner can change these settings.</p>}
                <div className={`board-settings-tab${readOnly ? " read-only" : ""}`} inert={readOnly}>
                    <ActiveTabComponent closeDialog={closeDialog} />
                </div>
            </div>

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
});
