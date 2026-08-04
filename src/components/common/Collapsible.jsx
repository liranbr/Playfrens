import { MdKeyboardArrowDown } from "react-icons/md";
import "./Collapsible.css";

/**
 * A section that smoothly collapses/expands its content.
 * Pass `header` (+ `onToggleCollapsed`) for a built-in chevron trigger, `actions` for extra
 * content beside it that shouldn't toggle collapse, and `sticky` to pin the header while its
 * content scrolls by.
 * @param {{
 *   collapsed: boolean,
 *   onToggleCollapsed?: () => void,
 *   header?: React.ReactNode,
 *   icon?: React.ReactNode | null,
 *   actions?: React.ReactNode,
 *   sticky?: boolean,
 *   triggerClassName?: string,
 *   rowClassName?: string,
 *   contentClassName?: string,
 *   children?: React.ReactNode,
 * }} props
 * @returns {JSX.Element}
 */
export function Collapsible({
    collapsed,
    onToggleCollapsed,
    header,
    icon = (
        <MdKeyboardArrowDown className={"collapsible-chevron" + (collapsed ? " collapsed" : "")} />
    ),
    actions,
    sticky = false,
    triggerClassName = "",
    rowClassName = "",
    contentClassName = "",
    children,
}) {
    return (
        <>
            {header !== undefined && (
                <div className={`collapsible-header-row ${rowClassName}`}>
                    <button
                        type="button"
                        className={
                            `collapsible-trigger ${triggerClassName}` +
                            (sticky ? " collapsible-trigger-sticky" : "")
                        }
                        onClick={onToggleCollapsed}
                    >
                        {icon}
                        {header}
                    </button>
                    {actions}
                </div>
            )}
            <div className={`collapsible ${collapsed ? "collapsed" : ""} ${contentClassName}`}>
                {children}
            </div>
        </>
    );
}
