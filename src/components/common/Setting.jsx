import "./Setting.css";

/**
 * A settings row, a title with optional extra content next to it (e.g. an InfoIcon),
 * a description, an optional "Default: X" annotation, and the setting's own control
 * passed as children.
 * @param {{
 *   title: React.ReactNode,
 *   titleExtra?: React.ReactNode,
 *   description?: React.ReactNode,
 *   defaultValue?: React.ReactNode,
 *   children?: React.ReactNode,
 * }} props
 * @returns {JSX.Element}
 */
export function Setting({ title, titleExtra, description, defaultValue, children }) {
    return (
        <div className="setting">
            <h3>
                {title}
                {titleExtra && <> {titleExtra}</>}
            </h3>
            {description && <p>{description}</p>}
            {defaultValue !== undefined && (
                <p className="setting-default">Default: {defaultValue}</p>
            )}
            {children}
        </div>
    );
}
