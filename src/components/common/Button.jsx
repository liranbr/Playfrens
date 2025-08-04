import "./Button.css";

/**
 * A standard button component with some variants
 * @param {{
 *   variant?: "primary" | "secondary" | "danger",
 *   className?: string,
 *   children?: React.ReactNode,
 * } & React.ButtonHTMLAttributes} props
 * @returns {JSX.Element}
 */
export function Button({ variant = "primary", className = "", children, ...rest }) {
    return (
        <button className={`btn btn-${variant} ${className}`} {...rest}>
            {children}
        </button>
    );
}
