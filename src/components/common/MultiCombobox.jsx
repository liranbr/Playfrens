import { IconButton } from "./IconButton.jsx";
import { SearchSelect } from "./SearchSelect.jsx";
import { MdClose } from "react-icons/md";
import "./MultiCombobox.css";

/**
 * A search input that picks from `options` not already in `selectedIds`, rendering each selected
 * option above the input as a removable combo. Uses SearchSelect.
 * @param {{
 *   options: {id: string}[],
 *   selectedIds: string[],
 *   getLabel?: (option) => string,
 *   pendingOptionId?: string,
 *   placeholder?: string,
 *   emptyPlaceholder?: string,
 *   onAdd: (option) => void,
 *   onRemove: (option) => void,
 * }} props
 * @returns {JSX.Element}
 */
export function MultiCombobox({
    options,
    selectedIds,
    getLabel = (option) => option.name,
    pendingOptionId,
    placeholder = "Search...",
    emptyPlaceholder = "Nothing left to add",
    onAdd,
    onRemove,
}) {
    const selected = options.filter((option) => selectedIds.includes(option.id));
    const unselected = options.filter((option) => !selectedIds.includes(option.id));

    return (
        <div className="multi-combobox">
            <div className="multi-combobox-combos">
                {selected.length > 0 ? (
                    selected.map((option) => (
                        <span key={option.id} className="multi-combobox-combo">
                            {getLabel(option)}
                            <IconButton
                                icon={<MdClose />}
                                disabled={pendingOptionId === option.id}
                                onClick={() => onRemove(option)}
                                aria-label={`Remove ${getLabel(option)}`}
                            />
                        </span>
                    ))
                ) : (
                    <span className="multi-combobox-combo-empty">None</span>
                )}
            </div>
            <SearchSelect
                // Remounts after every add/remove, clearing the query and forcing a fresh search
                // so a newly-(de)selected option immediately drops out of/into results.
                key={selectedIds.join(",")}
                placeholder={unselected.length > 0 ? placeholder : emptyPlaceholder}
                disabled={unselected.length === 0}
                onQuery={(query, setResults) => {
                    const needle = query.trim().toLowerCase();
                    setResults(
                        unselected
                            .filter((option) => getLabel(option).toLowerCase().includes(needle))
                            .map((option) => ({ id: option.id, name: getLabel(option) })),
                    );
                }}
                onSelect={(picked) => {
                    const option = options.find((o) => o.id === picked.id);
                    if (option) onAdd(option);
                }}
            />
        </div>
    );
}
