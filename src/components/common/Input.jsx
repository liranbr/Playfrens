import { useEffect, useRef, useState } from "react";

const DEFAULT_DEBOUNCE_MS = 600;
const DEFAULT_AUTOSAVE_MS = 5000;

/**
 * `<input>` with more functionality, pass `textarea` for `<textarea>` instead. 
 * 
 * Pass `value` + `onChange` for a plain controlled field.
 * 
 * Pass `value` + `onCommit` for a syncyend field: this will only call `onCommit` after `debounceMs` idle, every `autosaveMs`, on blur, or when `active`
 * goes false mid-edit.
 *
 * @param {{
 *   textarea?: boolean,
 *   value: string,
 *   onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void,
 *   onCommit?: (value: string) => void,
 *   active?: boolean,
 *   debounceMs?: number,
 *   autosaveMs?: number,
 *   rows?: number,
 *   spellCheck?: boolean,
 * } & React.InputHTMLAttributes<HTMLInputElement> & React.TextareaHTMLAttributes<HTMLTextAreaElement>} props
 * @returns {JSX.Element}
 */
export function Input({
    textarea = false,
    value,
    onChange,
    onCommit,
    active = true,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    autosaveMs = DEFAULT_AUTOSAVE_MS,
    rows = 4,
    spellCheck = false,
    className = "",
    onFocus,
    onBlur,
    ...rest
}) {
    const isSynced = typeof onCommit === "function";
    const Tag = textarea ? "textarea" : "input";

    const [draft, setDraft] = useState(value);
    const [isEditing, setIsEditing] = useState(false);
    const debounceTimer = useRef(null);
    const autosaveTimer = useRef(null);
    const draftRef = useRef(draft);
    draftRef.current = draft;

    const commit = (next) => {
        clearTimeout(debounceTimer.current);
        clearInterval(autosaveTimer.current);
        onCommit(next);
    };

    useEffect(() => {
        if (isSynced && !active && isEditing) {
            setIsEditing(false);
            commit(draftRef.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- only rerun when `active` changes
    }, [active]);

    useEffect(
        () => () => {
            clearTimeout(debounceTimer.current);
            clearInterval(autosaveTimer.current);
        },
        [],
    );

    return (
        <Tag
            className={className ? `ui-input ${className}` : "ui-input"}
            rows={textarea ? rows : undefined}
            spellCheck={spellCheck}
            value={isSynced ? (isEditing ? draft : value) : value}
            onFocus={(e) => {
                if (isSynced) {
                    setDraft(value);
                    setIsEditing(true);
                    clearInterval(autosaveTimer.current);
                    autosaveTimer.current = setInterval(
                        () => onCommit(draftRef.current),
                        autosaveMs,
                    );
                }
                onFocus?.(e);
            }}
            onChange={(e) => {
                if (isSynced) {
                    const next = e.target.value;
                    setDraft(next);
                    clearTimeout(debounceTimer.current);
                    debounceTimer.current = setTimeout(() => onCommit(next), debounceMs);
                }
                onChange?.(e);
            }}
            onBlur={(e) => {
                if (isSynced) {
                    setIsEditing(false);
                    commit(draft);
                }
                onBlur?.(e);
            }}
            {...rest}
        />
    );
}
