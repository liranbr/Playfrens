import "./Button.css";

export function Button(props) {
    const { children, variant = "primary", className, ...rest } = props;
    return (
        <button className={`button button-${variant} ${className}`} {...rest}>
            {children}
        </button>
    );
}
