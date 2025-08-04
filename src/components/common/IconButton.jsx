import "./IconButton.css";

/**
 * 'activate' makes it appear active, for cases like 'a dropdown is currently open from this button'
 * @param {{
 *   icon: React.ReactNode,
 *   activate?: boolean,
 *   className?: string,
 *   children?: React.ReactNode,
 * } & React.ButtonHTMLAttributes} props
 * @returns {JSX.Element}
 */
export function IconButton({ icon, activate = false, className = "", children, ...rest }) {
    return (
        <button className={`icon-button ${activate ? "activate " : "" + className}`} {...rest}>
            {icon ?? children}
        </button>
    );
}
