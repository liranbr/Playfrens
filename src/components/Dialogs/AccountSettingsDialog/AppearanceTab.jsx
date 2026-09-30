import { observer } from "mobx-react-lite";
import { RadioSetting, Setting, Slider } from "@/components";
import { FontSizeRange, ReduceMotionOptions, SettingsDefaults, useSettingsStore } from "@/stores";

export const AppearanceTab = observer(() => {
    const settingsStore = useSettingsStore();

    return (
        <>
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
        </>
    );
});
