import { usePageMeta } from "@/hooks/usePageMeta.js";
import "./CardPage.css";

export default function NotFound() {
    usePageMeta({
        title: "Page Not Found",
        description: "The page you're looking for doesn't exist.",
        path: window.location.pathname,
        noindex: true,
    });

    return (
        <div id="card-page" style={{ backgroundColor: "#000" }}>
            <img
                src="https://http.cat/404.jpg"
                alt="404 not found cat"
                style={{ maxWidth: "100%" }}
            />
            <a href="/" className="app-brand">
                <img src="/Playfrens_Logo.png" alt="Playfrens Logo" />
                Playfrens
            </a>
        </div>
    );
}
