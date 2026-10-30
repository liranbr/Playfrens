import { useState } from "react";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import "./SettingsDialog.css";

/**
 * Tab strip + scrollable body shared by the settings dialogs.
 * Tabs flagged `ownerOnly` render read-only when `canEditOwnerOnly` is false.
 * @param {{
 *   tabs: {[key: string]: { label: string, Component: React.ComponentType, ownerOnly?: boolean }},
 *   canEditOwnerOnly?: boolean,
 *   tabProps?: object,
 * }} props
 */
export function SettingsTabs({ tabs, canEditOwnerOnly = true, tabProps = {} }) {
    const [activeTab, setActiveTab] = useState(Object.keys(tabs)[0]);
    const activeTabInfo = tabs[activeTab];
    const ActiveTabComponent = activeTabInfo.Component;
    const readOnly = !canEditOwnerOnly && activeTabInfo.ownerOnly;

    return (
        <>
            <ToggleGroup.Root
                type="single"
                className="rx-toggle-group settings-tabs"
                value={activeTab}
                onValueChange={(tab) => tab && setActiveTab(tab)} // to avoid empty values
            >
                {Object.keys(tabs).map((tab) => (
                    <ToggleGroup.Item value={tab} key={tab}>
                        {tabs[tab].label}
                    </ToggleGroup.Item>
                ))}
            </ToggleGroup.Root>

            <div className="settings-dialog-body">
                {readOnly && <ReadOnlyCallout />}
                <div className={`settings-tab${readOnly ? " read-only" : ""}`} inert={readOnly}>
                    <ActiveTabComponent {...tabProps} />
                </div>
            </div>
        </>
    );
}

export function ReadOnlyCallout() {
    return <p className="dialog-callout">Only the owner can change these settings.</p>;
}
