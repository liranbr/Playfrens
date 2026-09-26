import * as RadixDropdown from "@radix-ui/react-dropdown-menu";
import { SimpleTooltip } from "./SimpleTooltip.jsx";

/**
 * A standard dropdown menu that skips writing Root, Trigger, Portal and Content subcomponents.
 * For the sub-menus use the Dropdown.Sub/SubTrigger/SubContent components inside children.
 * @param {{
 *   trigger: React.ReactNode,
 *   triggerClassName?: string,
 *   tooltip?: string,
 *   open?: boolean,
 *   onOpenChange?: (open: boolean) => void,
 *   align?: "start" | "center" | "end",
 *   side?: "top" | "right" | "bottom" | "left",
 *   sideOffset?: number,
 *   children?: React.ReactNode,
 * }} props
 * @returns {JSX.Element}
 */
export function Dropdown({
    trigger,
    triggerClassName,
    tooltip,
    open,
    onOpenChange,
    align = "start",
    side = "bottom",
    sideOffset = 5,
    children,
}) {
    const triggerElement = (
        <RadixDropdown.Trigger asChild className={triggerClassName}>
            {trigger}
        </RadixDropdown.Trigger>
    );
    return (
        <RadixDropdown.Root open={open} onOpenChange={onOpenChange}>
            {tooltip ? <SimpleTooltip message={tooltip}>{triggerElement}</SimpleTooltip> : triggerElement}
            <RadixDropdown.Portal>
                <RadixDropdown.Content
                    className="rx-dropdown-menu"
                    align={align}
                    side={side}
                    sideOffset={sideOffset}
                >
                    {children}
                </RadixDropdown.Content>
            </RadixDropdown.Portal>
        </RadixDropdown.Root>
    );
}

Dropdown.Item = RadixDropdown.Item;
Dropdown.Separator = RadixDropdown.Separator;
Dropdown.Sub = RadixDropdown.Sub;
Dropdown.SubTrigger = RadixDropdown.SubTrigger;

Dropdown.SubContent = function DropdownSubContent({ sideOffset = 5, ...rest }) {
    return (
        <RadixDropdown.SubContent className="rx-dropdown-menu" sideOffset={sideOffset} {...rest} />
    );
};
