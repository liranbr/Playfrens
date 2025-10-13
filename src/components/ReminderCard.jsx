import { observer } from "mobx-react-lite";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Popover from "@radix-ui/react-popover";
import { MdClose, MdDeleteOutline, MdEdit, MdMoreVert, MdRemove } from "react-icons/md";
import { useRef, useState } from "react";
import { useDataStore } from "@/stores";
import { Button, IconButton } from "@/components";
import { ReminderObject } from "@/models";
import "./ReminderCard.css";

/** @param {ReminderObject} props.reminder */
export const ReminderCard = observer(({ reminder }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [editorOpen, setEditorOpen] = useState(false);

    const classes = ["reminder-container"];
    if (reminder.date < new Date()) classes.push("activated");
    if (dropdownOpen || editorOpen) classes.push("dd-open");

    const containerRef = useRef(null);

    return (
        <div className={classes.join(" ")} ref={containerRef}>
            <span
                role="button"
                className="reminder"
                onContextMenu={(e) => {
                    e.preventDefault(); // don't open right-click context menu
                    setDropdownOpen(true); // open button's dropdown instead
                }}
                draggable="false"
            >
                <label>{reminder.getFormattedDate()}</label>
                <p>{reminder.message}</p>
            </span>
            <ReminderMenu
                reminder={reminder}
                dropdownOpen={dropdownOpen}
                setDropdownOpen={setDropdownOpen}
                setEditorOpen={setEditorOpen}
            />
            <ReminderEditor
                reminder={reminder}
                editorOpen={editorOpen}
                setEditorOpen={setEditorOpen}
                containerRef={containerRef}
            />
        </div>
    );
});

const ReminderMenu = observer(({ reminder, dropdownOpen, setDropdownOpen, setEditorOpen }) => {
    const dataStore = useDataStore();

    const DD = DropdownMenu;
    return (
        <DD.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <DD.Trigger asChild>
                <IconButton icon={<MdMoreVert />} />
            </DD.Trigger>

            <DD.Portal>
                <DD.Content
                    className="rx-dropdown-menu"
                    align={"start"}
                    side={"bottom"}
                    sideOffset={5}
                >
                    {/* the 1ms timeout lets the dropdown close before opening the editor popover */}
                    <DD.Item onClick={() => setTimeout(() => setEditorOpen(true), 1)}>
                        <MdEdit /> Edit
                    </DD.Item>
                    <DD.Item data-danger onClick={() => dataStore.removeReminder(reminder)}>
                        <MdDeleteOutline /> Delete
                    </DD.Item>
                </DD.Content>
            </DD.Portal>
        </DD.Root>
    );
});

const ReminderEditor = observer(({ reminder, editorOpen, setEditorOpen, containerRef }) => {
    const [date, setDate] = useState(reminder.date);
    const [message, setMessage] = useState(reminder.message);
    const dataStore = useDataStore();

    const handleDateChange = (e) => {
        const newDate = e.target.value ? new Date(e.target.value) : null;
        setDate(newDate);
    };

    const handleSave = () => {
        const edited = dataStore.editReminder(reminder, date, message);
        if (edited) setEditorOpen(false);
    };

    const canSaveEdit = date && message && (date !== reminder.date || message !== reminder.message);

    return (
        <Popover.Root open={editorOpen} onOpenChange={setEditorOpen}>
            <Popover.Anchor ref={containerRef} />
            <Popover.Portal container={containerRef.current}>
                <Popover.Content align="center" className="rx-popover">
                    <Popover.Close asChild>
                        <IconButton className="popover-close" icon={<MdClose />} />
                    </Popover.Close>
                    <h3>Edit Reminder</h3>
                    <input
                        className="date-input"
                        type="date"
                        value={date ? date.toISOString().split("T")[0] : ""}
                        onChange={handleDateChange}
                        autoFocus
                    />
                    <textarea
                        className="reminder-textarea"
                        rows={4}
                        spellCheck={false}
                        value={message}
                        placeholder="Message"
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={1000}
                    />
                    <Button variant="primary" disabled={!canSaveEdit} onClick={handleSave}>
                        Save
                    </Button>
                </Popover.Content>
            </Popover.Portal>
        </Popover.Root>
    );
});
