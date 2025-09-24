import { useDebouncedCallback } from "@/Utils";
import { useRef, useState } from "react";
import "./SearchSelect.css";

/**
 * @param {{
 *   onQuery: (newQuery: string, setSelected: React.Dispatch<string[]>) => void,
 *   delay: number,
 *   defaultValue: string,
 *   value: string,
 *   onValueChange: (string) => void,
 *   onSelect: (string) => void,
 * } & React.InputHTMLAttributes} props
 * @returns {JSX.Element}
 */
export function SearchSelect({
    onQuery,
    delay = 0,
    defaultValue = "",
    value,
    onValueChange,
    onSelect,
    ...inputRest
}) {
    const [internalQuery, setInternalQuery] = useState(defaultValue);
    const query = value !== undefined ? value : internalQuery; // prefer external value
    const setQuery = value !== undefined ? onValueChange : setInternalQuery;
    const [showDropdown, setShowDropdown] = useState(false);
    const [highlighted, setHighlighted] = useState(-1);
    const [results, setResults] = useState([]);

    const inputRef = useRef(null);
    const resultsRef = useRef(null);
    const debouncedQuery = useDebouncedCallback(onQuery, delay);
    debouncedQuery(query, setResults); // activate query on render

    const handleInputChange = (e) => {
        const newQuery = e.target.value;
        setShowDropdown(true);
        setQuery(newQuery);
        setHighlighted(-1);
        debouncedQuery(newQuery, setResults);
    };

    const handleKeyDown = (e) => {
        if (results.length === 0 || !showDropdown) {
            inputRest?.onKeyDown?.(e);
            return;
        }
        let skipInputKeyDown = false;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlighted((h) => Math.min(h + 1, results.length - 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlighted((h) => Math.max(h - 1, 0));
        } else if (e.key === "Enter" && highlighted >= 0 && showDropdown) {
            skipInputKeyDown = true;
            handleOptionClick(results[highlighted]);
        }
        if (!skipInputKeyDown) inputRest?.onKeyDown?.(e);
    };

    const handleOptionClick = (option) => {
        setShowDropdown(false);
        onSelect(option);
        setQuery(option.name);
        debouncedQuery(option.name, setResults);
    };

    const handleMouseDown = (e) => {
        setShowDropdown(
            (inputRef.current && inputRef.current.contains(e.target)) ||
                (resultsRef.current && resultsRef.current.contains(e.target)),
        );
    };

    return (
        <div style={{ position: "relative" }} onMouseDown={handleMouseDown}>
            <input
                ref={inputRef}
                {...inputRest}
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={(e) => {
                    setShowDropdown(true);
                    inputRest?.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setShowDropdown(false);
                    inputRest?.onBlur?.(e);
                }}
                style={{ width: "100%", ...inputRest.style }}
                type="text"
            />
            {results.length > 0 && showDropdown && (
                <ul
                    className="rx-select-content"
                    style={{ position: "absolute", width: "100%", maxWidth: "none" }}
                    ref={resultsRef}
                >
                    {results.map((option, idx) => (
                        <li
                            tabIndex={idx}
                            className={"list-item" + (highlighted === idx ? " highlighted" : "")}
                            key={option.name + "-id-" + option.id}
                            onMouseDown={() => handleOptionClick(option)}
                        >
                            {option.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
