import * as Avatar from "@radix-ui/react-avatar";
import { observer } from "mobx-react-lite";
import { MdPerson } from "react-icons/md";
import { useDataStore, useSettingsStore } from "@/stores";
import "./FriendAvatar.css";

/**
 * Small square Steam avatar for a Friend tag, falling back to a person icon when there's no iconURL.
 * Follows the "Friend Icons" display setting (Hide / Hide Missing / Show All). Pass
 * ignoreDisplaySetting to always show it instead, e.g. for a live icon-URL preview.
 * @param {{ iconURL?: string, className?: string, ignoreDisplaySetting?: boolean }} props
 */
export const FriendAvatar = observer(
    ({ iconURL, className = "", ignoreDisplaySetting = false }) => {
        const settingsStore = useSettingsStore();
        const dataStore = useDataStore();
        let displayMode = ignoreDisplaySetting ? "showAll" : settingsStore.friendIconDisplay;

        // Hide Missing is pointless noise when NO friend has an icon yet - every slot would be an empty
        // placeholder. Fall back to fully hidden until at least one friend actually has an icon set.
        // anyFriendHasIcon is a cached computed on DataStore, shared across every FriendAvatar
        // instance, instead of each one separately re-scanning every friend on every render.
        if (displayMode === "hideMissing" && !dataStore.anyFriendHasIcon) displayMode = "hide";

        if (displayMode === "hide") return null;

        // No icon set, and set ones aren't being hidden: keep the same-sized slot, just invisible,
        // so a mix of friends with/without icons doesn't jitter the surrounding layout.
        if (displayMode === "hideMissing" && !iconURL)
            return (
                <span className={`friend-avatar rx-avatar friend-avatar-invisible ${className}`} />
            );

        return (
            <Avatar.Root className={`friend-avatar rx-avatar ${className}`}>
                <Avatar.Image src={iconURL || undefined} referrerPolicy="no-referrer" />
                <Avatar.Fallback className="rx-avatarless" asChild>
                    <MdPerson />
                </Avatar.Fallback>
            </Avatar.Root>
        );
    },
);
