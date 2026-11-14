import { useId } from "react";
import { observer } from "mobx-react-lite";
import { InfoIcon } from "@/components";
import { useSettingsStore } from "@/stores";
import { Item } from "./Item.jsx";
import { Dropdown } from "./Dropdown.jsx";
import { Radio } from "./Radio.jsx";
import { Slider } from "./Slider.jsx";
import { Toggle } from "./Toggle.jsx";

/**
 * A settings row that takes SettingObject.
 * This merges <Item /> and a setting into one component.
 * @returns {JSX.Element}
 */
export const Setting = observer(({ setting }) => {
    const settingsStore = useSettingsStore();
    const props = {
        name: useId(),
        value: setting.value,
        onChange: (value) => settingsStore.set(setting, value),
    };

    let control;
    switch (setting.settingType) {
        case "toggle":
            control = <Toggle {...props} />;
            break;
        case "dropdown":
            control = <Dropdown {...props} options={setting.options} />;
            break;
        case "radio":
            control = <Radio {...props} options={setting.options} />;
            break;
        case "slider":
            control = (
                <Slider
                    {...props}
                    {...setting.range}
                    formatValue={(v) => `${v}${setting.unit ?? ""}`}
                />
            );
            break;
        default:
            console.warn(`Unknown settingType "${setting.settingType}" for "${setting.title}"`);
            return null;
    }

    return (
        <Item
            title={setting.title}
            titleExtra={setting.info && <InfoIcon message={setting.info} />}
            description={setting.description}
            isDefault={settingsStore.isDefault(setting)}
            onReset={() => settingsStore.reset(setting)}
        >
            {control}
        </Item>
    );
});
