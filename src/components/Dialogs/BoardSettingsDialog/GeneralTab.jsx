import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button, InfoIcon, RadioSetting, Setting } from "@/components";
import {
    globalBoardStore,
    SettingsDefaults,
    ShowMatureContentOptions,
    useFilterStore,
    useSettingsStore,
} from "@/stores";
import { ReadOnlyCallout } from "../SettingsTabs.jsx";
import { toastError, toastSuccess } from "@/Utils";

export const GeneralTab = observer(({ closeDialog }) => {
    const board = globalBoardStore.activeBoard;
    const isOwner = globalBoardStore.isOwner;
    const [name, setName] = useState(board?.name ?? "");
    const [saving, setSaving] = useState(false);

    // Keep the input in sync if the board changes out from under us (e.g. someone else renamed it).
    useEffect(() => setName(board?.name ?? ""), [board?.name]);

    const trimmed = name.trim();
    const canSave = !saving && trimmed && trimmed !== board?.name;

    async function handleSave() {
        if (!canSave) return;
        setSaving(true);
        try {
            await globalBoardStore.renameBoard(board.id, trimmed);
            toastSuccess("Board renamed");
        } catch (err) {
            toastError(err.message);
        } finally {
            setSaving(false);
        }
    }
    const saveOnEnter = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <>
            {!isOwner && (
                <div className="board-guest-header">
                    <h3 className="board-name-header">{board?.name}</h3>
                    <ReadOnlyCallout />
                </div>
            )}
            {isOwner && (
                <fieldset>
                    <label className="board-name-label">Board Name</label>
                    <div className="board-name-row">
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={saveOnEnter}
                        />
                        <Button variant="primary" disabled={!canSave} onClick={handleSave}>
                            Save
                        </Button>
                    </div>
                </fieldset>
            )}

            <div className={`settings-tab${isOwner ? "" : " read-only"}`} inert={!isOwner}>
                <FilterSettings />
            </div>

            {isOwner && (
                <>
                    <div className="separator" />
                    <DeleteBoardButton board={board} closeDialog={closeDialog} />
                </>
            )}
        </>
    );
});

const FilterSettings = observer(() => {
    const settingsStore = useSettingsStore();
    const filterStore = useFilterStore();

    return (
        <>
            <Setting
                title="Show Explicit Content"
                titleExtra={
                    <InfoIcon message="Only affects games whose main content is explicit sexual material. Games with general mature themes, violence, or occasional nudity aren't hidden by this." />
                }
                description="Include explicit/adult-only games when searching for a game to add"
                isDefault={settingsStore.showMatureContent === SettingsDefaults.showMatureContent}
                onReset={() =>
                    settingsStore.setShowMatureContent(SettingsDefaults.showMatureContent)
                }
            >
                <RadioSetting
                    name="showMatureContent"
                    value={settingsStore.showMatureContent}
                    options={ShowMatureContentOptions}
                    onChange={(option) => settingsStore.setShowMatureContent(option)}
                />
            </Setting>

            <Setting
                title="Default Filter State"
                description="Set current filters as the default state to show on load"
            >
                <div className="default-filters-buttons">
                    <Button variant="secondary" onClick={() => filterStore.saveDefaultFilters()}>
                        Set as Default
                    </Button>
                    <Button variant="secondary" onClick={() => filterStore.resetDefaultFilters()}>
                        Reset
                    </Button>
                </div>
            </Setting>
        </>
    );
});

const DELETE_WARNING_DURATION_SECONDS = 10;
const DeleteBoardButton = ({ board, closeDialog }) => {
    const isOnlyBoard = globalBoardStore.boards.length <= 1;
    const [startedCountdown, setStartedCountdown] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(DELETE_WARNING_DURATION_SECONDS);
    const [countdownCleared, setCountdownCleared] = useState(false);

    useEffect(() => {
        if (!startedCountdown) return;
        const countdownInterval = setInterval(() => {
            if (secondsRemaining <= 0) {
                setSecondsRemaining(0);
                clearInterval(countdownInterval);
                setCountdownCleared(true);
                return;
            }
            setSecondsRemaining(secondsRemaining - 1);
        }, 1000);
        return () => clearInterval(countdownInterval);
    }, [secondsRemaining, startedCountdown]);

    async function handleDelete() {
        try {
            await globalBoardStore.deleteBoard(board.id);
            closeDialog();
        } catch (err) {
            toastError(err.message);
        }
    }

    if (isOnlyBoard) {
        return (
            <div className="dialog-callout">
                <small>
                    This is your only board, so it can&apos;t be deleted. Create another one first
                    if you want to get rid of this one.
                </small>
            </div>
        );
    }

    if (!startedCountdown) {
        return (
            <Button variant="danger-secondary" onClick={() => setStartedCountdown(true)}>
                Delete Board
            </Button>
        );
    }

    return (
        <Button variant="danger" disabled={!countdownCleared} onClick={handleDelete}>
            {secondsRemaining > 0 ? `Are you sure? (${secondsRemaining})` : "Yes, Delete Board"}
        </Button>
    );
};
