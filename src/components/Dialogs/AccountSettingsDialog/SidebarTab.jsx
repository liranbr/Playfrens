import { observer } from "mobx-react-lite";
import { RadioSetting, Setting } from "@/components";
import {
    TagHoverGameHighlightOptions,
    TagGameCounterOptions,
    FriendIconDisplayOptions,
    SettingsDefaults,
    useSettingsStore,
} from "@/stores";

export const SidebarTab = observer(() => {
    const settingsStore = useSettingsStore();

    return (
        <>
            <Setting
                title="Tag Hover Highlight"
                description="Highlight games when hovering on a sidebar tag"
                isDefault={
                    settingsStore.tagHoverGameHighlight === SettingsDefaults.tagHoverGameHighlight
                }
                onReset={() =>
                    settingsStore.setTagHoverGameHighlight(SettingsDefaults.tagHoverGameHighlight)
                }
            >
                <RadioSetting
                    name="tagHoverGameHighlight"
                    value={settingsStore.tagHoverGameHighlight}
                    options={TagHoverGameHighlightOptions}
                    onChange={(option) => settingsStore.setTagHoverGameHighlight(option)}
                />
            </Setting>

            <Setting
                title="Game Count Badge"
                description="Show a Game Counter next to each Tag in the Sidebar"
                isDefault={
                    settingsStore.tagGameCounterDisplay === SettingsDefaults.tagGameCounterDisplay
                }
                onReset={() =>
                    settingsStore.setTagGameCounterDisplay(SettingsDefaults.tagGameCounterDisplay)
                }
            >
                <RadioSetting
                    name="tagGameCounter"
                    value={settingsStore.tagGameCounterDisplay}
                    options={TagGameCounterOptions}
                    onChange={(option) => settingsStore.setTagGameCounterDisplay(option)}
                />
            </Setting>

            <Setting
                title="Friend Icons"
                description="Show friend avatars in the Friends sidebar and a game's tag list"
                isDefault={settingsStore.friendIconDisplay === SettingsDefaults.friendIconDisplay}
                onReset={() =>
                    settingsStore.setFriendIconDisplay(SettingsDefaults.friendIconDisplay)
                }
            >
                <RadioSetting
                    name="friendIconDisplay"
                    value={settingsStore.friendIconDisplay}
                    options={FriendIconDisplayOptions}
                    onChange={(option) => settingsStore.setFriendIconDisplay(option)}
                />
            </Setting>
        </>
    );
});
