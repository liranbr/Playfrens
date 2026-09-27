import { observer } from "mobx-react-lite";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components";
import { globalBoardStore } from "@/stores";
import { DialogBase } from "./DialogRoot.jsx";
import { SettingsTabs } from "./SettingsTabs.jsx";
import { AccountTab } from "./AccountSettingsDialog/AccountTab.jsx";
import { SidebarTab } from "./AccountSettingsDialog/SidebarTab.jsx";
import { GamesGridTab } from "./AccountSettingsDialog/GamesGridTab.jsx";
import "./AccountSettingsDialog.css";

const AccountSettingsTabs = {
    account: { label: "Account", Component: AccountTab },
    sidebar: { label: "Sidebar", Component: SidebarTab, ownerOnly: true },
    grid: { label: "Games Grid", Component: GamesGridTab, ownerOnly: true },
};

export const AccountSettingsDialog = observer(({ open, closeDialog }) => {
    return (
        <DialogBase
            open={open}
            onOpenChange={closeDialog}
            contentProps={{
                onOpenAutoFocus: (e) => {
                    e.preventDefault(); // Focuses the dialog content instead of the first interactable element
                    e.target.focus();
                },
                className: "rx-dialog settings-dialog account-settings-dialog",
            }}
        >
            <Dialog.Title>Account Settings</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>Account information and display settings</Dialog.Description>
            </VisuallyHidden>

            <SettingsTabs tabs={AccountSettingsTabs} canEditOwnerOnly={globalBoardStore.isOwner} />

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
});
