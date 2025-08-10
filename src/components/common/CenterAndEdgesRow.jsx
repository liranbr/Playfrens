import "./CenterAndEdgesRow.css";

/**
 * <b>Requires three children elements.</b>
 *
 * Places first child on the left edge, second in the center, and third on the right edge.
 * @param {{className, children} & React.HTMLAttributes<HTMLDivElement>} props
 * @returns {JSX.Element}
 */
export function CenterAndEdgesRow({ children, className = "" }) {
    return <div className={`center-and-edges-row ${className}`}>{children}</div>;
}
