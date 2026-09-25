import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import * as Popover from "@radix-ui/react-popover";
import { MdOutlineCheckCircle, MdOutlineNotifications } from "react-icons/md";
import { useDataStore } from "@/stores";
import { ReminderCard } from "@/components";

export const Notifications = observer(() => {
    const timeoutDuration = 15 * 60 * 1000; // Every 15 minutes, check whether reminders have activated to update the badge
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => forceUpdate((n) => n + 1), timeoutDuration);
        return () => clearInterval(interval);
    });

    const [popoverOpen, setPopoverOpen] = useState(false);
    const dataStore = useDataStore();
    const reminders = dataStore.sortedReminders;

    const now = new Date();
    const activeRemindersCount = reminders.filter((r) => r.date < now).length;

    return (
        <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
            <Popover.Trigger asChild>
                <button className={"notifications-button" + (popoverOpen ? " activated" : "")}>
                    {activeRemindersCount > 0 && (
                        <span className="notifications-badge">{activeRemindersCount}</span>
                    )}
                    <MdOutlineNotifications />
                </button>
            </Popover.Trigger>
            <Popover.Content className="rx-popover notifications-drawer" align="end" sideOffset={5}>
                <div className="reminders-list">
                    {reminders.length === 0 ? (
                        <div className="no-reminders">
                            <MdOutlineCheckCircle />
                            You have no reminders.
                        </div>
                    ) : (
                        reminders.map((reminder) => (
                            <ReminderCard key={reminder.id} reminder={reminder} outsideOfGamePage />
                        ))
                    )}
                </div>
            </Popover.Content>
        </Popover.Root>
    );
});
