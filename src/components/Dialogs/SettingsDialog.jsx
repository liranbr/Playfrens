import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import * as RadioGroup from "@radix-ui/react-radio-group";
import { Button } from "@/components";
import { DialogBase } from "./DialogRoot.jsx";
import {
    TagGameCounterOptions,
    TagHoverGameHighlightOptions,
    useFilterStore,
    useSettingsStore,
} from "@/stores";
import "./SettingsDialog.css";

export const SettingsDialog = ({ open, closeDialog }) => {
    const settingsStore = useSettingsStore();
    const filterStore = useFilterStore();

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
                {Object.keys(TagHoverGameHighlightOptions).map((option) => {
                    const optKey = `tagHoverGameHighlight-${option}`;
                    return (
                        <label htmlFor={optKey} key={optKey}>
                            <RadioGroup.Item value={option} id={optKey} />
                            {TagHoverGameHighlightOptions[option]}
                        </label>
                    );
                })}
            </RadioGroup.Root>

            <div className="spacer" />
            <p>Show a Game Counter next to each Tag in the Sidebar</p>
            <RadioGroup.Root
                defaultValue={settingsStore.tagGameCounterDisplay}
                className="rx-radio-group"
                onValueChange={(option) => settingsStore.setTagGameCounterDisplay(option)}
            >
                {Object.keys(TagGameCounterOptions).map((option) => {
                    const optKey = `tagGameCounter-${option}`;
                    return (
                        <label htmlFor={optKey} key={optKey}>
                            <RadioGroup.Item value={option} id={optKey} />
                            {TagGameCounterOptions[option]}
                        </label>
                    );
                })}
            </RadioGroup.Root>

            <div className="spacer" />
            <p>Set current filters as the default state to use on load</p>
            <div className="default-filters-buttons">
                <Button variant="secondary" onClick={() => filterStore.saveDefaultFilters()}>
                    Set as Default
                </Button>
                <Button variant="secondary" onClick={() => filterStore.resetDefaultFilters()}>
                    Reset
                </Button>
            </div>

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
};
