import { observer } from "mobx-react-lite";
import { RadioSetting, Setting, SettingsSection, Slider } from "@/components";
import {
    FontSizeRange,
    FriendIconDisplayOptions,
    GamesGridCardWidthRange,
    GamesGridDensityOptions,
    HideGameStoreButtonsOptions,
    ReduceMotionOptions,
    TagGameCounterOptions,
    TagHoverGameHighlightOptions,
    SettingsDefaults,
    useSettingsStore,
} from "@/stores";

export const AppearanceTab = observer(() => {
    const settingsStore = useSettingsStore();

    return (
        <>
            <SettingsSection title="General" subtitle="Size and motion across the whole app">
                <Setting
                    title="Font Size"
                    description="Scales text and spacing across the whole app"
                    isDefault={settingsStore.fontSize === SettingsDefaults.fontSize}
                    onReset={() => settingsStore.setFontSize(SettingsDefaults.fontSize)}
                >
                    <Slider
                        min={FontSizeRange.min}
                        max={FontSizeRange.max}
                        step={FontSizeRange.step}
                        value={settingsStore.fontSize}
                        onChange={(value) => settingsStore.setFontSize(value)}
                        formatValue={(v) => `${v}%`}
                    />
                </Setting>

                <Setting
                    title="Reduce Motion"
                    description="Turns off animations and transitions"
                    isDefault={settingsStore.reduceMotion === SettingsDefaults.reduceMotion}
                    onReset={() => settingsStore.setReduceMotion(SettingsDefaults.reduceMotion)}
                >
                    <RadioSetting
                        name="reduceMotion"
                        value={settingsStore.reduceMotion}
                        options={ReduceMotionOptions}
                        onChange={(option) => settingsStore.setReduceMotion(option)}
                    />
                </Setting>
            </SettingsSection>

            <SettingsSection title="Sidebar" subtitle="How tags look and behave in the sidebar">
                <Setting
                    title="Tag Hover Highlight"
                    description="Highlight games when hovering on a sidebar tag"
                    isDefault={
                        settingsStore.tagHoverGameHighlight ===
                        SettingsDefaults.tagHoverGameHighlight
                    }
                    onReset={() =>
                        settingsStore.setTagHoverGameHighlight(
                            SettingsDefaults.tagHoverGameHighlight,
                        )
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
                        settingsStore.tagGameCounterDisplay ===
                        SettingsDefaults.tagGameCounterDisplay
                    }
                    onReset={() =>
                        settingsStore.setTagGameCounterDisplay(
                            SettingsDefaults.tagGameCounterDisplay,
                        )
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
                    isDefault={
                        settingsStore.friendIconDisplay === SettingsDefaults.friendIconDisplay
                    }
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
            </SettingsSection>

            <SettingsSection title="Games Grid" subtitle="Layout of the game cards">
                <Setting
                    title="Game Card Size"
                    description="Width of game cards in the grid, more or fewer fit per row automatically"
                    isDefault={
                        settingsStore.gamesGridCardWidth === SettingsDefaults.gamesGridCardWidth
                    }
                    onReset={() =>
                        settingsStore.setGamesGridCardWidth(SettingsDefaults.gamesGridCardWidth)
                    }
                >
                    <Slider
                        min={GamesGridCardWidthRange.min}
                        max={GamesGridCardWidthRange.max}
                        step={GamesGridCardWidthRange.step}
                        value={settingsStore.gamesGridCardWidth}
                        onChange={(value) => settingsStore.setGamesGridCardWidth(value)}
                        formatValue={(v) => `${v}px`}
                    />
                </Setting>

                <Setting
                    title="Grid Spacing"
                    description="Padding and gaps between cards in the games grid"
                    isDefault={settingsStore.gamesGridDensity === SettingsDefaults.gamesGridDensity}
                    onReset={() =>
                        settingsStore.setGamesGridDensity(SettingsDefaults.gamesGridDensity)
                    }
                >
                    <RadioSetting
                        name="gamesGridDensity"
                        value={settingsStore.gamesGridDensity}
                        options={GamesGridDensityOptions}
                        onChange={(option) => settingsStore.setGamesGridDensity(option)}
                    />
                </Setting>

                <Setting
                    title="Obscure Game Platform Actions"
                    description="In a Game Page, hide the 'Play' and 'Store Page' buttons unless cover art is hovered on"
                    isDefault={
                        settingsStore.hideGameStoreButtons === SettingsDefaults.hideGameStoreButtons
                    }
                    onReset={() =>
                        settingsStore.setHideGameStoreButtons(SettingsDefaults.hideGameStoreButtons)
                    }
                >
                    <RadioSetting
                        name="hideGameStoreButtons"
                        value={settingsStore.hideGameStoreButtons}
                        options={HideGameStoreButtonsOptions}
                        onChange={(option) => settingsStore.setHideGameStoreButtons(option)}
                    />
                </Setting>
            </SettingsSection>
        </>
    );
});
