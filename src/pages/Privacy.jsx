import { usePageMeta } from "@/hooks/usePageMeta.js";
import "./Privacy.css";
import "../components/common/CardPageLayout.css";

export default function Privacy() {
    usePageMeta({
        title: "Privacy Policy",
        description: "Information regarding what data we collect, how it's used, and your rights.",
        path: "/privacy",
    });

    return (
        <div id="card-page">
            <div className="card-page-body">
                <div className="card-page-header">
                    <h1>Privacy Policy</h1>
                </div>
                <PrivacyPolicy />
            </div>
            <a href="/" className="app-brand">
                <img src="/Playfrens_Logo.png" alt="Playfrens Logo" />
                Playfrens
            </a>
        </div>
    );
}

function PrivacyPolicy() {
    return (
        <div className="privacy-policy-text">
            <h2 id="we-may-collect-pii">When you visit, sign up, or otherwise use the site</h2>
            <p>We may collect necessary personally identifiable information (PII).</p>
            <h2 id="what-data-collected">What Data do we Collect?</h2>
            <h3 id="3rd-party-accounts">Account Providers</h3>
            <p>
                If you sign up using one of our 3rd party account authentication providers (Steam,
                Google, Discord), we will automatically create a 3rd party profile entry.{" "}
            </p>
            <p>
                This entry is made of your account type, account ID, display name and profile
                picture url.
            </p>
            <h3 id="email">Email Address</h3>
            <p>If you sign up using an email and password combination, we will store your email.</p>
            <p>
                Besides signing in, an email is also required if you want us to send you email
                notifications.
            </p>
            <h3 id="ip">IP</h3>
            <p>
                We may record your IP in system logs, along with visited URL and/or user-agent. Logs
                are removed automatically after about a month.
            </p>
            <p>In cases where we detect abuse, your IP may be temporarily blocked.</p>
            <h2 id="data-storage-duration">For how long will we store your data?</h2>
            <p>
                Data from logs are deleted automatically after a short amount of time, usually a
                month.
            </p>
            <p>
                Data associated with your account will be stored until you decide to delete your
                account.
            </p>
            <h2 id="cookies">Cookies</h2>
            <p>
                We use a necessary session cookie to maintain your login session. This cookie
                expires when your session ends or after a defined period. For accounts using an email, when you reset password or
                delete your account, all your login sessions end immediately.
            </p>
            <p>We do not use analytics, tracking, or advertising cookies.</p>
            <h2 id="sharing-data">Sharing data</h2>
            <p>
                We are not sharing any PII to anyone. We are not selling away your emails nor any
                other data that could identify you, and we never will.
            </p>
            <p>
                We may share statistical data about the website such as number of registered users
                or how many visits we get.
            </p>
            <h3>External Services</h3>
            <p>
                The infrastructure of Playfrens relies on some external services, and complies with
                them:
            </p>
            <p>
                <b>Render</b> is the host of our backend server.{" "}
                <a href="https://render.com/docs/certifications-compliance">(Compliance Link)</a>
            </p>
            <p>
                <b>Supabase</b> is the host of our database.{" "}
                <a href="https://supabase.com/legal/dpa">(Compliance Link)</a>
            </p>
            <p>
                <b>
                    NOTE: These providers are used in this stage of development, and are subject to
                    change
                </b>
            </p>
            <h2 id="right-to-erasure">Right to erasure - deleting your account</h2>
            <p>
                You have a right to erasure of all your personal data. You may do so from your
                Account Settings.
            </p>
            <p>
                If you decide to permanently delete your account, your data will be immediately
                deleted (with an exception of your user ID (random alphanumeric string), that will
                be stored so it can&#39;t be used again).
            </p>
            <p>
                Any information you have created in boards belonging to other users will be left,
                but where an author is mentioned, it will be shown as deleted.
            </p>
            <p>
                Data that may have been stored in logs or backups will be removed during automatic
                rollover.
            </p>
            <h2 id="contact">Contact</h2>
            <p>
                See <a href="/contact">Contact page</a>.
            </p>
        </div>
    );
}
