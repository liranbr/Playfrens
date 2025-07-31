import "./Button.css";

/**
 * A standard button component with some variants
 * @param {{
 *   children?: React.ReactNode,
 *   variant?: "primary" | "secondary" | "danger",
 *   className?: string,
 * }} props
 * @returns {JSX.Element}
 */
export function Button({ variant = "primary", className = "", children, ...rest }) {
    return (
        <button className={`btn btn-${variant} ${className}`} {...rest}>
            {children}
        </button>
    );
}
