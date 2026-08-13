import "./LabelBadge.css";

/**
 * An annotation that is set next to a field label like "Icon URL (optional)".
 * Defaults to "optional", pass children to reuse it for a different annotation later.
 * @param {{ children?: React.ReactNode }} props
 */
export function LabelBadge({ children = "optional" }) {
    return <span className="label-badge">({children})</span>;
}
