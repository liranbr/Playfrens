import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import * as Popover from "@radix-ui/react-popover";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { MdHistory, MdOutlineCheckCircle, MdOutlineNotifications } from "react-icons/md";
import { Dialogs, globalBoardHistoryStore, globalDialogStore, useDataStore } from "@/stores";
import { ReminderCard } from "@/components";

const tabs = { reminders: "Reminders", history: "History" };

export const Notifications = observer(() => {
    const timeoutDuration = 15 * 60 * 1000; // Every 15 minutes, check whether reminders have activated to update the badge
    const [, forceUpdate] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => forceUpdate((n) => n + 1), timeoutDuration);
        return () => clearInterval(interval);
    });

    const [popoverOpen, setPopoverOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("reminders");
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
                <ToggleGroup.Root
                    type="single"
                    className="rx-toggle-group notifications-tabs"
                    value={activeTab}
                    onValueChange={(tab) => tab && setActiveTab(tab)} // to avoid empty values
                >
                    {Object.entries(tabs).map(([tab, label]) => (
                        <ToggleGroup.Item value={tab} key={tab}>
                            {label}
                        </ToggleGroup.Item>
                    ))}
                </ToggleGroup.Root>
                {activeTab === "reminders" ? (
                    <div className="reminders-list">
                        {reminders.length === 0 ? (
                            <div className="no-reminders">
                                <MdOutlineCheckCircle />
                                You have no reminders.
                            </div>
                        ) : (
                            reminders.map((reminder) => (
                                <ReminderCard
                                    key={reminder.id}
                                    reminder={reminder}
                                    outsideOfGamePage
                                />
                            ))
                        )}
                    </div>
                ) : (
                    <BoardHistory onOpenGame={() => setPopoverOpen(false)} />
                )}
            </Popover.Content>
        </Popover.Root>
    );
});

const BoardHistory = observer(({ onOpenGame }) => {
    const dataStore = useDataStore();
    const entries = globalBoardHistoryStore.entries;

    if (entries.length === 0) {
        return (
            <div className="reminders-list">
                <div className="no-reminders">
                    <MdHistory />
                    No recent activity.
                </div>
            </div>
        );
    }

    return (
        <div className="reminders-list board-history">
            {entries.map((entry) => {
                const game = entry.gameLink && dataStore.allGames.get(entry.gameLink.gameID);
                const openGame = () => {
                    onOpenGame();
                    globalDialogStore.open(Dialogs.GamePage, {
                        game,
                        openOnPartyID: game.getParty(entry.gameLink.partyID)
                            ? entry.gameLink.partyID
                            : undefined,
                    });
                };
                return (
                    <div
                        key={entry.id}
                        className={"board-history-entry" + (game ? " clickable" : "")}
                        role={game ? "button" : undefined}
                        tabIndex={game ? 0 : undefined}
                        onClick={game ? openGame : undefined}
                        onKeyDown={game ? (e) => e.key === "Enter" && openGame() : undefined}
                    >
                        <label>
                            {entry.author && <b>{entry.author.name}</b>}
                            {new Date(entry.date).toLocaleString()}
                        </label>
                        <p>{entry.message}</p>
                    </div>
                );
            })}
        </div>
    );
});
