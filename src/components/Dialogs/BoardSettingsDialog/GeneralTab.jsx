import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { MdContentCopy } from "react-icons/md";
import { Button, InfoIcon, Setting, ToggleSetting } from "@/components";
import {
    defaultFiltersStorageKey,
    globalBoardStore,
    SettingsDefaults,
    useFilterStore,
    useSettingsStore,
} from "@/stores";
import { ReadOnlyCallout } from "../SettingsTabs.jsx";
import { loadFromStorage, toastError, toastSuccess } from "@/Utils";
import { useDelayedButton } from "@/hooks/useDelayedButton.jsx";
import { STRING_LIMITS } from "#shared/boardLimits.js";

export const GeneralTab = observer(({ closeDialog }) => {
    const board = globalBoardStore.activeBoard;
    const isOwner = globalBoardStore.isOwner;
    const [name, setName] = useState(board?.name ?? "");
    const [saving, setSaving] = useState(false);

    // Keep the input in sync if the board changes out from under us (e.g. someone else renamed it).
    useEffect(() => setName(board?.name ?? ""), [board?.name]);

    const trimmed = name.trim();
    const canSave = !saving && trimmed && trimmed !== board?.name;
    const link = `${window.location.origin}/board/${board.shortId}`;

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
            <fieldset>
                {isOwner && (
                    <>
                        <label>Board Name</label>
                        <div className="board-name-row">
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={saveOnEnter}
                                maxLength={STRING_LIMITS.BOARD_NAME}
                            />
                            <Button variant="primary" disabled={!canSave} onClick={handleSave}>
                                Save
                            </Button>
                        </div>
                    </>
                )}

                <label>Board Link</label>
                <div className="link-copy-row">
                    {board.isPublic && <span className="field-badge">Publicly viewable</span>}
                    <input readOnly value={link} onFocus={(e) => e.target.select()} />
                    <Button
                        variant="secondary"
                        className="square-button"
                        onClick={() =>
                            navigator.clipboard
                                .writeText(link)
                                .then(() =>
                                    toastSuccess("Board link copied!", "", { personal: true }),
                                )
                                .catch((err) => toastError("Failed to copy: " + err))
                        }
                    >
                        <MdContentCopy />
                    </Button>
                </div>
            </fieldset>

            <div className="separator" />

            <div className={`settings-tab${isOwner ? "" : " read-only"}`} inert={!isOwner}>
                {isOwner && board && <PublicLinkSetting board={board} />}
                <FilterSettings />
            </div>

            {isOwner && <DeleteBoardButton board={board} closeDialog={closeDialog} />}
        </>
    );
});

const PublicLinkSetting = observer(({ board }) => {
    const [saving, setSaving] = useState(false);

    async function handleChange(checked) {
        if (saving) return;
        setSaving(true);
        try {
            await globalBoardStore.setVisibility(board.id, checked);
            toastSuccess(checked ? "Board is now publicly viewable" : "Board is now private");
        } catch (err) {
            toastError(err.message);
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <Setting
                title="Public Read-Only Link"
                description="Anyone with the board link can view it without logging in, but can't change anything"
            >
                <ToggleSetting
                    name="togglePublicReadOnly"
                    value={board.isPublic}
                    onChange={(checked) => handleChange(checked)}
                />
            </Setting>
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
                description="Include explicit/adult-only games when adding games"
                isDefault={
                    settingsStore.toggleShowMatureContent ===
                    SettingsDefaults.toggleShowMatureContent
                }
                onReset={() =>
                    settingsStore.setToggleShowMatureContent(
                        SettingsDefaults.toggleShowMatureContent,
                    )
                }
            >
                <ToggleSetting
                    name="toggleShowMatureContent"
                    value={settingsStore.toggleShowMatureContent}
                    onChange={(checked) => settingsStore.setToggleShowMatureContent(checked)}
                />
            </Setting>

            <Setting
                title="Default Filter State"
                description="Set current filters as the default state to show on load"
                onReset={() => filterStore.resetDefaultFilters()}
                isDefault={loadFromStorage(defaultFiltersStorageKey, {}) === {}} // TODO: This doesn't properly check. Anyway, lets convert defaultFilters to a regular Board Setting.
            >
                <div className="default-filters-buttons">
                    <Button variant="secondary" onClick={() => filterStore.saveDefaultFilters()}>
                        Set
                    </Button>
                </div>
            </Setting>
        </>
    );
});

const DeleteBoardButton = ({ board, closeDialog }) => {
    const isOnlyBoard = globalBoardStore.boards.length <= 1;
    const { startDelay, delayOngoing, delayStarted, secondsRemaining } = useDelayedButton(10);

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

    return !delayStarted ? (
        <Button variant="danger-secondary" onClick={startDelay}>
            Delete Board
        </Button>
    ) : (
        <Button variant="danger" disabled={delayOngoing} onClick={handleDelete}>
            {delayOngoing ? `Are you sure? (${secondsRemaining}s)` : "Yes, Delete Board"}
        </Button>
    );
};
