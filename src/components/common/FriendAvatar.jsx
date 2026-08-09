import * as Avatar from "@radix-ui/react-avatar";
import { MdPerson } from "react-icons/md";
import "./FriendAvatar.css";

/**
 * Small square Steam avatar for a Friend tag, falling back to a person icon when there's no iconURL.
 * @param {{ iconURL?: string, className?: string }} props
 */
export function FriendAvatar({ iconURL, className = "" }) {
    return (
        <Avatar.Root className={`friend-avatar rx-avatar ${className}`}>
            <Avatar.Image src={iconURL || undefined} referrerPolicy="no-referrer" />
            <Avatar.Fallback className="rx-avatarless" asChild>
                <MdPerson />
            </Avatar.Fallback>
        </Avatar.Root>
    );
}
