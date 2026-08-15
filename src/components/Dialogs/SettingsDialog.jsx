import { useState } from "react";
import { observer } from "mobx-react-lite";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Button } from "@/components";
import { DialogBase } from "./DialogRoot.jsx";
import { SidebarTab } from "./SettingsDialog/SidebarTab.jsx";
import { GamesGridTab } from "./SettingsDialog/GamesGridTab.jsx";
import { FiltersTab } from "./SettingsDialog/FiltersTab.jsx";
import "./SettingsDialog.css";

const SettingsTabs = {
    sidebar: { label: "Sidebar", Component: SidebarTab },
    grid: { label: "Games Grid", Component: GamesGridTab },
    filters: { label: "Filters", Component: FiltersTab },
};

export const SettingsDialog = observer(({ open, closeDialog }) => {
    const [activeTab, setActiveTab] = useState(Object.keys(SettingsTabs)[0]);
    const ActiveTabComponent = SettingsTabs[activeTab].Component;

    return (
        <DialogBase
            open={open}
            onOpenChange={closeDialog}
            contentProps={{ className: "rx-dialog settings-dialog" }}
        >
            <Dialog.Title>Settings</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>Configure application settings</Dialog.Description>
            </VisuallyHidden>

            <ToggleGroup.Root
                type="single"
                className="rx-toggle-group settings-tabs"
                value={activeTab}
                onValueChange={(tab) => tab && setActiveTab(tab)} // to avoid empty values
            >
                {Object.keys(SettingsTabs).map((tab) => (
                    <ToggleGroup.Item value={tab} key={tab}>
                        {SettingsTabs[tab].label}
                    </ToggleGroup.Item>
                ))}
            </ToggleGroup.Root>

            <div className="settings-dialog-body">
                <ActiveTabComponent />
            </div>

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
});
