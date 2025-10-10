import { observer } from "mobx-react-lite";
import "./ReminderCard.css";
import { useDataStore } from "@/stores/index.js";
import { MdMoreVert, MdRemove } from "react-icons/md";
import { IconButton } from "@/components";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useState } from "react";

export const ReminderCard = observer(({ reminder, onClick }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const classes = ["reminder-container"];
    if (reminder.date < new Date()) classes.push("activated");
    if (dropdownOpen) classes.push("dd-open");

    return (
        <div className={classes.join(" ")}>
            <span
                role="button"
                className="reminder"
                onClick={onClick}
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
            />
        </div>
    );
});

const ReminderMenu = observer(({ reminder, dropdownOpen, setDropdownOpen }) => {
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
                    <DD.Item data-danger onClick={() => dataStore.removeReminder(reminder)}>
                        <MdRemove /> Remove
                    </DD.Item>
                </DD.Content>
            </DD.Portal>
        </DD.Root>
    );
});
