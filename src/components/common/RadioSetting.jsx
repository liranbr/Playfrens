import * as RadioGroup from "@radix-ui/react-radio-group";

export function RadioSetting({ name, value, options, onChange }) {
    return (
        <RadioGroup.Root defaultValue={value} className="rx-radio-group" onValueChange={onChange}>
            {Object.keys(options).map((option) => {
                const optKey = `${name}-${option}`;
                return (
                    <label htmlFor={optKey} key={optKey}>
                        <RadioGroup.Item value={option} id={optKey} />
                        {options[option]}
                    </label>
                );
            })}
        </RadioGroup.Root>
    );
}
