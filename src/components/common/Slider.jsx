import { useEffect, useState } from "react";
import "./Slider.css";

/**
 * A themed range input with a live value readout next to it.
 *
 * The displayed value/thumb track every drag tick, but the `onChange` only fires once the interaction
 * actually ends, a range input's onChange fires continuously while dragging, and callers typically
 * persist/sync on change, so firing on every tick would otherwise spam that.
 *
 * @param {{
 *   value: number,
 *   min: number,
 *   max: number,
 *   step?: number,
 *   onChange: (value: string) => void,
 *   formatValue?: (value: number) => React.ReactNode,
 * }} props
 * @returns {JSX.Element}
 */
export function Slider({ value, min, max, step = 1, onChange, formatValue = (v) => v }) {
    const [liveValue, setLiveValue] = useState(value);
    // Stay in sync if `value` changes for a reason other than our own commit below like loaded from storage
    useEffect(() => setLiveValue(value), [value]);

    const commit = (e) => onChange(e.target.value);
    return (
        <div className="slider-row">
            <input
                type="range"
                className="rx-slider"
                min={min}
                max={max}
                step={step}
                value={liveValue}
                onChange={commit}
                onPointerUp={commit}
                onBlur={commit}
                onKeyUp={commit}
            />
            <span className="slider-value">{formatValue(liveValue)}</span>
        </div>
    );
}
