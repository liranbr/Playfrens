/**
 * Shared shell for the "#card-page" pages (Login, Contact, Privacy, etc.):
 * a centered card with a header and a footer link, plus the logo link outside it.
 * @param {{
 *   title: React.ReactNode,
 *   subtitle?: React.ReactNode,
 *   children?: React.ReactNode,
 * }} props
 * @returns {JSX.Element}
 */
export function CardPageLayout({ title, subtitle, children }) {
    return (
        <div id="card-page">
            <div className="card-page-body">
                <div className="card-page-header">
                    <h1>{title}</h1>
                    {subtitle && <span>{subtitle}</span>}
                </div>
                {children}
                <div className="login-footer">
                    <a href="/privacy">Privacy Policy</a>
                </div>
            </div>
            <a href="/" className="app-brand">
                <img src="/Playfrens_Logo.png" alt="Playfrens Logo" />
                Playfrens
            </a>
        </div>
    );
}
