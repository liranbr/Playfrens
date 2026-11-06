import * as Switch from "@radix-ui/react-switch";

export function ToggleSetting({ name, value, onChange }) {
    return (
        <Switch.Root id={name} className="rx-switch" checked={value} onCheckedChange={onChange}>
            <Switch.Thumb className="rx-switch-thumb" />
        </Switch.Root>
    );
}
