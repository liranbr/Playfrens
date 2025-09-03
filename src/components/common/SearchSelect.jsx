import { useDebouncedCallback } from "@/Utils";
import { useRef, useState } from "react";


/**
 * 'activate' makes it appear active, for cases like 'a dropdown is currently open from this button'
 * @param {{
 *   onQuery: (newQuery: string, setSelected: React.Dispatch<string[]>) => void,
 *   delay: number,
 *   onSelect: (string) => void,
 * } & React.InputHTMLAttributes} props
 * @returns {JSX.Element}
 */
export function SearchSelect({ onQuery, delay = 0, onSelect, ...inputRest }) {
    const [query, setQuery] = useState(inputRest?.value ?? "");
    const [selected, setSelected] = useState(undefined);
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const [results, setResults] = useState([]);

    const ulRef = useRef();
    const inputRef = useRef();
    const debouncedQuery = useDebouncedCallback(onQuery, delay);

    const handleInputChange = (e) => {
        const newQuery = e.target.value;
        setSelected(undefined)
        setQuery(newQuery);
        setHighlighted(-1);
        debouncedQuery(newQuery, setResults);
    };

    const handleKeyDown = (e) => {
        if (results.length === 0) return;
        console.log(e.key)
        if (e.key === "ArrowDown") {
            setHighlighted(h => Math.min(h + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            setHighlighted(h => Math.max(h - 1, 0));
        } else if (e.key === "Enter" && highlighted >= 0) {
            setSelected(results[highlighted]);
            onSelect(results[highlighted]);
            setQuery(results[highlighted]);
        }
    };

    const handleOptionClick = (option) => {
        setSelected(option);
        onSelect(option)
        setQuery(option);
        setShowDropdown(false);
    };

    const handleMouseDown = (e) => {
        setShowDropdown(
            (inputRef.current && inputRef.current.contains(e.target)) ||
            (ulRef.current && ulRef.current.contains(e.target))
        );
    }

    return (
        <div
            style={{ position: "relative", width: "100%" }}
            onMouseDown={handleMouseDown}
        >
            <input
                ref={inputRef}
                {...inputRest}
                value={query}
                onChange={(e) => { handleInputChange(e); inputRest?.onChange?.(e); }}
                onKeyDown={(e) => { handleKeyDown(e); inputRest?.onKeyDown?.(e); }}
                onFocus={(e) => { setShowDropdown(true); inputRest?.onFocus?.(e); }}
                onBlur={(e) => { setShowDropdown(false); inputRest?.onBlur?.(e); }}
                placeholder="Start typing..."
                style={{ width: "100%" }}
                type="text"
            />
            {results.length > 0 && !selected && showDropdown && (
                <ul
                    className="rx-select-content"
                    style={{ position: "absolute", width: "100%", maxWidth: "none" }}
                    ref={ulRef}
                >
                    {results.map((option, idx) => (
                        <li
                            key={option}
                            onMouseDown={() => handleOptionClick(option)}
                            style={{
                                width: "100%",
                                padding: "8px 12px",
                                cursor: "pointer",
                                background: highlighted === idx ? "#695d5d3a" : "none"
                            }}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}