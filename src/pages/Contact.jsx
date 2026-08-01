import { usePageMeta } from "@/hooks/usePageMeta.js";
import "./Contact.css";
import "./CardPage.css";

export default function Contact() {
    usePageMeta({
        title: "Contact",
        description: "Need help? Join our Discord or send us an email!",
        path: "/contact",
    });

    return (
        <div id="card-page">
            <div className="card-page-body">
                <div className="card-page-header">
                    <h1>Contact</h1>
                </div>
                <div className="contact-links">
                    <h2>Discord Server</h2>
                    <a
                        href="https://discord.gg/aTdwEGau4Q"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        https://discord.gg/aTdwEGau4Q
                    </a>
                    <p>Share feedback, report bugs, or just say hi</p>
                    <h2>Email</h2>
                    <p>
                        To contact us privately, share feedback, or let us know what
                        you&apos;d like to see next, email us at
                    </p>
                    <a href="mailto:playfrens@proton.me">playfrens@proton.me</a>
                </div>
            </div>
            <a href="/" className="app-brand">
                <img src="/Playfrens_Logo.png" alt="Playfrens Logo" />
                Playfrens
            </a>
        </div>
    );
}
