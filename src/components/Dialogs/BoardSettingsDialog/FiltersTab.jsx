import { observer } from "mobx-react-lite";
import { Button, InfoIcon, RadioSetting, Setting } from "@/components";
import {
    ShowMatureContentOptions,
    SettingsDefaults,
    useFilterStore,
    useSettingsStore,
} from "@/stores";

export const FiltersTab = observer(() => {
    const settingsStore = useSettingsStore();
    const filterStore = useFilterStore();

    return (
        <>
            <Setting
                title="Show Explicit Content"
                titleExtra={
                    <InfoIcon message="Only affects games whose main content is explicit sexual material. Games with general mature themes, violence, or occasional nudity aren't hidden by this." />
                }
                description="Include explicit/adult-only games when searching for a game to add"
                isDefault={settingsStore.showMatureContent === SettingsDefaults.showMatureContent}
                onReset={() =>
                    settingsStore.setShowMatureContent(SettingsDefaults.showMatureContent)
                }
            >
                <RadioSetting
                    name="showMatureContent"
                    value={settingsStore.showMatureContent}
                    options={ShowMatureContentOptions}
                    onChange={(option) => settingsStore.setShowMatureContent(option)}
                />
            </Setting>

            <Setting
                title="Default Filter State"
                description="Set current filters as the default state to show on load"
            >
                <div className="default-filters-buttons">
                    <Button variant="secondary" onClick={() => filterStore.saveDefaultFilters()}>
                        Set as Default
                    </Button>
                    <Button variant="secondary" onClick={() => filterStore.resetDefaultFilters()}>
                        Reset
                    </Button>
                </div>
            </Setting>
        </>
    );
});
