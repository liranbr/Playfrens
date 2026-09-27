import { observer } from "mobx-react-lite";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components";
import { DialogBase } from "./DialogRoot.jsx";
import { SettingsTabs } from "./SettingsTabs.jsx";
import { GeneralTab } from "./BoardSettingsDialog/GeneralTab.jsx";
import { MembersTab } from "./BoardSettingsDialog/MembersTab.jsx";
import "./BoardSettingsDialog.css";

const BoardSettingsTabs = {
    general: { label: "General", Component: GeneralTab },
    members: { label: "Members", Component: MembersTab },
};

export const BoardSettingsDialog = observer(({ open, closeDialog }) => {
    return (
        <DialogBase
            open={open}
            onOpenChange={closeDialog}
            contentProps={{
                className: "rx-dialog settings-dialog board-settings-dialog",
                onOpenAutoFocus: (e) => {
                    e.preventDefault(); // Focuses the dialog content instead of the first interactable element
                    e.target.focus();
                },
            }}
        >
            <Dialog.Title>Board Settings</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>
                    Manage this board&apos;s name, members, and filters
                </Dialog.Description>
            </VisuallyHidden>

            <SettingsTabs tabs={BoardSettingsTabs} tabProps={{ closeDialog }} />

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
});
