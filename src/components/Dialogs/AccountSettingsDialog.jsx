import { observer } from "mobx-react-lite";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components";
import { DialogBase } from "./DialogRoot.jsx";
import { SettingsTabs } from "./SettingsTabs.jsx";
import { AccountTab } from "./AccountSettingsDialog/AccountTab.jsx";
import { AppearanceTab } from "./AccountSettingsDialog/AppearanceTab.jsx";
import "./AccountSettingsDialog.css";

const AccountSettingsTabs = {
    account: { label: "Account", Component: AccountTab },
    appearance: { label: "Appearance", Component: AppearanceTab },
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

            <SettingsTabs tabs={AccountSettingsTabs} />

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
});
