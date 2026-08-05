import * as Dialog from "@radix-ui/react-dialog";
import * as Avatar from "@radix-ui/react-avatar";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MdPerson } from "react-icons/md";
import { Fragment, useState } from "react";
import { DialogBase } from "./DialogRoot";
import "./SteamConfirmImportDialog.css";
import { Button } from "../common/Button";
import { Collapsible } from "../common/Collapsible.jsx";
import { globalDialogStore, useDataStore } from "@/stores";
import { saveLastSteamSync } from "@/services/SteamImport.js";

const IMPORT_GROUPS = [
    {
        key: "games",
        title: "Games",
        itemNoun: "game",
        importChanges: (dataStore, result) => dataStore.importSteamGames(result),
    },
    {
        key: "friends",
        title: "Friends",
        itemNoun: "friend",
        importChanges: (dataStore, result) => dataStore.importFriends(result),
    },
];

const allIndexes = (length) => new Set(Array.from({ length }, (_, i) => i));

const hasResult = (result) => Object.keys(result).length > 0;

const initSelection = (result) => ({
    toAdd: allIndexes(result.toAdd?.length ?? 0),
    toUpdate: allIndexes(result.toUpdate?.old?.length ?? 0),
});

// Pairs each item with its original index (selection state is keyed by that index) before
// sorting shortest name first, so the paired index still points at the right entry anyways.
const sortByNameLength = (list) =>
    list
        .map((item, i) => [item, i])
        .sort(([a], [b]) => (a.title || a.name).length - (b.title || b.name).length);

const FriendIcon = ({ iconURL }) => (
    <Avatar.Root className="steam-confirm-import-item-icon rx-avatar">
        <Avatar.Image src={iconURL || undefined} referrerPolicy="no-referrer" />
        <Avatar.Fallback className="rx-avatarless" asChild>
            <MdPerson />
        </Avatar.Fallback>
    </Avatar.Root>
);

const BulkActions = ({ allDisabled, clearDisabled, onAll, onClear }) => (
    <span className="steam-confirm-import-bulk-actions">
        <Button
            variant="primary"
            className="steam-confirm-import-bulk-btn"
            disabled={allDisabled}
            onClick={onAll}
        >
            All
        </Button>
        <Button
            variant="danger"
            className="steam-confirm-import-bulk-btn"
            disabled={clearDisabled}
            onClick={onClear}
        >
            Clear
        </Button>
    </span>
);

const ImportGroup = ({
    kind,
    data,
    title,
    itemNoun,
    selection,
    onToggleItem,
    onSelectAll,
    collapsed,
    onToggleCollapsed,
}) => {
    const { toAdd, toUpdate, toSkip } = data;
    const { old } = toUpdate;
    const showIcons = kind === "friends";

    const [collapsedSections, setCollapsedSections] = useState({});
    const toggleSection = (sectionKey) =>
        setCollapsedSections((curr) => ({ ...curr, [sectionKey]: !curr[sectionKey] }));

    const appendItem = (name, iconURL, indx, type, checked, onToggle) => {
        if (!onToggle) {
            return (
                <div className={`steam-confirm-import-item item-${type}`} key={`${name}-${indx}`}>
                    {showIcons && <FriendIcon iconURL={iconURL} />}
                    {name}
                </div>
            );
        }
        return (
            <button
                type="button"
                className={
                    `steam-confirm-import-item item-${type}` + (checked ? "" : " item-unchecked")
                }
                key={`${name}-${indx}`}
                aria-pressed={checked}
                onClick={() => onToggle(indx)}
            >
                {showIcons && <FriendIcon iconURL={iconURL} />}
                {name}
            </button>
        );
    };

    // For updates, show the incoming icon (what it becomes) rather than the outdated one being replaced.
    const getIcon = (d, i, type) => {
        if (type === "update") return toUpdate.latest[i]?.iconURL ?? d.iconURL;
        return d.iconURL;
    };

    const createList = (list, type, label, listKey, sectionKey) => {
        if (list.length === 0) return null;

        const selected = listKey && selection[listKey];
        const allSelected = !!selected && selected.size === list.length;
        const noneSelected = !!selected && selected.size === 0;
        const sectionCollapsed = !!collapsedSections[sectionKey];
        const countText = listKey ? `${selected.size}/${list.length}` : `${list.length}`;

        return (
            <Collapsible
                collapsed={sectionCollapsed}
                onToggleCollapsed={() => toggleSection(sectionKey)}
                header={
                    <>
                        {label} {countText} {itemNoun}
                        {list.length > 1 ? "s" : ""}:
                    </>
                }
                triggerClassName="steam-confirm-import-section-toggle"
                rowClassName="steam-confirm-import-section-header"
                actions={
                    listKey && (
                        <BulkActions
                            allDisabled={allSelected}
                            clearDisabled={noneSelected}
                            onAll={() => onSelectAll(listKey, list.length, true)}
                            onClear={() => onSelectAll(listKey, list.length, false)}
                        />
                    )
                }
            >
                <div className="steam-confirm-import-list">
                    {sortByNameLength(list).map(([d, i]) =>
                        appendItem(
                            d.title || d.name,
                            getIcon(d, i, type),
                            i,
                            type,
                            listKey ? selected.has(i) : true,
                            listKey ? (idx) => onToggleItem(listKey, idx) : null,
                        ),
                    )}
                </div>
            </Collapsible>
        );
    };

    return (
        <div className="steam-confirm-import-container">
            <Collapsible
                collapsed={collapsed}
                onToggleCollapsed={onToggleCollapsed}
                header={<h2>{title}</h2>}
                sticky
                triggerClassName="steam-confirm-import-header"
            >
                <div className="steam-confirm-import-scrollable">
                    <fieldset>
                        {createList(toAdd, "add", "Adding", "toAdd", "toAdd")}
                        {createList(old, "update", "Updating", "toUpdate", "toUpdate")}
                        {createList(toSkip, "skip", "Skipping", null, "toSkip")}
                    </fieldset>
                </div>
            </Collapsible>
        </div>
    );
};

// Summarizes what will actually happen based on the current checkbox selection.
const summarizeSelection = (result, groupSelection) => {
    if (!hasResult(result)) return undefined;

    const changes = [];
    if (groupSelection.toAdd.size) changes.push("add " + groupSelection.toAdd.size);
    if (groupSelection.toUpdate.size) changes.push("update " + groupSelection.toUpdate.size);
    if (result.toSkip.length) changes.push("skip " + result.toSkip.length);
    return changes.length ? "will " + changes.join(", ") : "no changes selected";
};

const SteamProfileHeader = ({ steamProfile, results, selection }) => {
    if (!steamProfile) return null;
    const { name, iconURL, profileURL } = steamProfile;

    const summaryLines = IMPORT_GROUPS.map(({ key, title }) => {
        const summary = summarizeSelection(results[key], selection[key]);
        return summary && `${title}: ${summary}`;
    }).filter(Boolean);

    return (
        <div className="steam-confirm-import-profile">
            <Avatar.Root className="rx-avatar">
                <Avatar.Image src={iconURL || undefined} referrerPolicy="no-referrer" />
                <Avatar.Fallback className="rx-avatarless" asChild>
                    <MdPerson />
                </Avatar.Fallback>
            </Avatar.Root>
            <div className="steam-confirm-import-info">
                <h3>
                    <a href={profileURL || undefined} target="_blank" rel="noreferrer">
                        {name}
                    </a>
                </h3>
                {summaryLines.map((line) => (
                    <p key={line}>{line}</p>
                ))}
            </div>
        </div>
    );
};

export const SteamConfirmImportDialog = ({
    open,
    closeDialog,
    gamesResult,
    friendsResult,
    steamProfile,
    syncOptions,
}) => {
    const dataStore = useDataStore();
    const results = { games: gamesResult, friends: friendsResult };
    const visibleGroups = IMPORT_GROUPS.filter(({ key }) => hasResult(results[key]));

    const [selection, setSelection] = useState(() => ({
        games: initSelection(gamesResult),
        friends: initSelection(friendsResult),
    }));

    const [collapsedGroups, setCollapsedGroups] = useState({ games: false, friends: false });
    const toggleGroupCollapsed = (groupKey) =>
        setCollapsedGroups((curr) => ({ ...curr, [groupKey]: !curr[groupKey] }));

    const toggleItem = (groupKey, listKey, index) => {
        setSelection((curr) => {
            const nextList = new Set(curr[groupKey][listKey]);
            nextList.has(index) ? nextList.delete(index) : nextList.add(index);
            return { ...curr, [groupKey]: { ...curr[groupKey], [listKey]: nextList } };
        });
    };

    const selectAll = (groupKey, listKey, length, checked) => {
        setSelection((curr) => ({
            ...curr,
            [groupKey]: { ...curr[groupKey], [listKey]: checked ? allIndexes(length) : new Set() },
        }));
    };

    const applySelection = (result, groupSelection) => {
        if (!hasResult(result)) return result;
        return {
            toAdd: result.toAdd.filter((_, i) => groupSelection.toAdd.has(i)),
            toUpdate: {
                old: result.toUpdate.old.filter((_, i) => groupSelection.toUpdate.has(i)),
                latest: result.toUpdate.latest.filter((_, i) => groupSelection.toUpdate.has(i)),
            },
            toSkip: result.toSkip,
        };
    };

    const selectedCount = visibleGroups.reduce(
        (sum, { key }) => sum + selection[key].toAdd.size + selection[key].toUpdate.size,
        0,
    );

    const pushImport = () => {
        visibleGroups.forEach(({ key, importChanges }) =>
            importChanges(dataStore, applySelection(results[key], selection[key])),
        );
        if (steamProfile?.steamID)
            saveLastSteamSync({
                steamID: steamProfile.steamID,
                profile: steamProfile,
                options: syncOptions,
            });
        globalDialogStore.closeMultiple(2);
    };

    return (
        <DialogBase
            open={open}
            onOpenChange={closeDialog}
            contentProps={{
                className: "rx-dialog steam-confirm-import-dialog",
                onOpenAutoFocus: (e) => {
                    e.preventDefault();
                    e.target.focus();
                },
            }}
        >
            <Dialog.Title>Confirm Import</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>Confirm if these matches your results.</Dialog.Description>
            </VisuallyHidden>
            <SteamProfileHeader steamProfile={steamProfile} results={results} selection={selection} />
            <div className="steam-confirm-import-body">
                {visibleGroups.map(({ key, title, itemNoun }, i) => (
                    <Fragment key={key}>
                        {i > 0 && <div className="separator" />}
                        <ImportGroup
                            kind={key}
                            data={results[key]}
                            title={title}
                            itemNoun={itemNoun}
                            selection={selection[key]}
                            onToggleItem={(listKey, idx) => toggleItem(key, listKey, idx)}
                            onSelectAll={(listKey, length, checked) =>
                                selectAll(key, listKey, length, checked)
                            }
                            collapsed={collapsedGroups[key]}
                            onToggleCollapsed={() => toggleGroupCollapsed(key)}
                        />
                    </Fragment>
                ))}
            </div>
            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Cancel
                </Button>
                <Button variant="primary" disabled={selectedCount === 0} onClick={pushImport}>
                    Import
                </Button>
            </div>
        </DialogBase>
    );
};
