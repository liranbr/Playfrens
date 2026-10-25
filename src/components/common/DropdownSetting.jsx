import * as Select from "@radix-ui/react-select";
import { MdCheck, MdKeyboardArrowDown } from "react-icons/md";

export function DropdownSetting({ name, value, options, onChange }) {
    return (
        <Select.Root value={value} onValueChange={onChange} className="rx-select">
            <Select.Trigger
                className="rx-select-trigger"
                onPointerDown={(e) => e.stopPropagation()}
            >
                <Select.Value />
                <Select.Icon>
                    <MdKeyboardArrowDown />
                </Select.Icon>
            </Select.Trigger>

            <Select.Content position="popper" className="rx-select-content">
                <Select.Viewport>
                    {Object.keys(options).map((option) => {
                        const optKey = `${name}-${option}`;
                        return (
                            <Select.Item value={option} key={optKey}>
                                <Select.ItemText>{options[option]}</Select.ItemText>
                                <Select.ItemIndicator className="item-indicator">
                                    <MdCheck />
                                </Select.ItemIndicator>
                            </Select.Item>
                        );
                    })}
                </Select.Viewport>
            </Select.Content>
        </Select.Root>
    );
}
