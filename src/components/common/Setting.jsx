import { MdRefresh } from "react-icons/md";
import { IconButton, SimpleTooltip } from "@/components";
import "./Setting.css";

/**
 * A settings row, a title with optional extra content next to it (e.g. an InfoIcon),
 * a description, and the setting's own control passed as children. 
 * 
 * isDefault - Boolean that checks if its currently default, false shows the Reset Icon.
 * 
 * onReset - Clicking the Rest icon will call this callback. Only available if isDefault = false.
 * @param {{
 *   title: React.ReactNode,
 *   titleExtra?: React.ReactNode,
 *   description?: React.ReactNode,
 *   isDefault?: boolean,
 *   onReset?: () => void,
 *   children?: React.ReactNode,
 * }} props
 * @returns {JSX.Element}
 */
export function Setting({ title, titleExtra, description, isDefault = true, onReset, children }) {
    return (
        <div className="setting">
            <h3>
                {title}
                {titleExtra && <> {titleExtra}</>}
                {onReset && (
                    <SimpleTooltip message="Restore default">
                        <IconButton
                            className={`setting-reset${isDefault ? " setting-reset-hidden" : ""}`}
                            icon={<MdRefresh />}
                            aria-label="Restore default"
                            onClick={onReset}
                        />
                    </SimpleTooltip>
                )}
            </h3>
            {description && <p>{description}</p>}
            {children}
        </div>
    );
}
