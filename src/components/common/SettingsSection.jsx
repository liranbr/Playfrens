import "./SettingsSection.css";

/** A titled group of Settings */
export function SettingsSection({ title, subtitle, children }) {
    return (
        <section className="settings-section">
            <header>
                <h3>{title}</h3>
                {subtitle && <p>{subtitle}</p>}
            </header>
            {children}
        </section>
    );
}
