import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Button } from "@/components";
import { DialogBase } from "./DialogRoot.jsx";
import { TagGameCounterOptions, TagHoverGameHighlightOptions, useSettingsStore } from "@/stores";
import "./SettingsDialog.css";

export const SettingsDialog = ({ open, closeDialog }) => {
    const settingsStore = useSettingsStore();

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

            <p>Highlight games when hovering on a sidebar tag</p>
            <RadioGroup.Root
                defaultValue={settingsStore.tagHoverGameHighlight}
                className="rx-radio-group"
                onValueChange={(option) => settingsStore.setTagHoverGameHighlight(option)}
            >
                {Object.keys(TagHoverGameHighlightOptions).map((option) => (
                    <label htmlFor={option} key={option}>
                        <RadioGroup.Item value={option} id={option} />
                        {TagHoverGameHighlightOptions[option]}
                    </label>
                ))}
            </RadioGroup.Root>
            <div className="spacer" />

            <p>Show a Game Counter next to each Tag in the Sidebar</p>
            <RadioGroup.Root
                defaultValue={settingsStore.tagGameCounterDisplay}
                className="rx-radio-group"
                onValueChange={(option) => settingsStore.setTagGameCounterDisplay(option)}
            >
                {Object.keys(TagGameCounterOptions).map((option) => (
                    <label htmlFor={option} key={option}>
                        <RadioGroup.Item value={option} id={option} autoFocus />
                        {TagGameCounterOptions[option]}
                    </label>
                ))}
            </RadioGroup.Root>

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
};
