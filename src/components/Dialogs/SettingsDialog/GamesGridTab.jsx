import { observer } from "mobx-react-lite";
import { RadioSetting, Setting, Slider } from "@/components";
import {
    GamesGridDensityOptions,
    GamesGridCardWidthRange,
    HideGameStoreButtonsOptions,
    SettingsDefaults,
    useSettingsStore,
} from "@/stores";

export const GamesGridTab = observer(() => {
    const settingsStore = useSettingsStore();

    return (
        <>
            <Setting
                title="Game Card Size"
                description="Width of game cards in the grid, more or fewer fit per row automatically"
                isDefault={settingsStore.gamesGridCardWidth === SettingsDefaults.gamesGridCardWidth}
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
                onReset={() => settingsStore.setGamesGridDensity(SettingsDefaults.gamesGridDensity)}
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
        </>
    );
});
