import { useNavigate } from "react-router-dom";
import { Button, SimpleTooltip } from "@/components";
import "./Home.css";

export function Home() {
    return (
        <div id="home">
            <div className="sticky-header">
                <div className="app-brand">
                    <img src="/Playfrens_Logo.png" alt="Playfrens Logo" />
                    Playfrens
                </div>
                <OpenPlayfrens />
            </div>

            <div className="home-body">
                <div className="nav-header">
                    {/*TODO: build it like Obsidian's, ul with li's and a flex-grow: 1 separator*/}
                    <SimpleTooltip message="working on it ^^'">
                        <a href="/">Discord</a>
                    </SimpleTooltip>
                    <a href="https://github.com/liranbr/Playfrens" target="_blank" aria-disabled>
                        GitHub
                    </a>
                    <a href="/contact">Contact</a>
                    <a href="/privacy">Privacy</a>
                </div>
                <div className="main-content">
                    <h1>This will be a homepage</h1>
                    <span>where we'll show how cool the app is 😎</span>
                    <OpenPlayfrens className="main-action" />
                </div>
            </div>
        </div>
    );
}

function OpenPlayfrens({ className = "" }) {
    return (
        <a href="/app" className={"open-playfrens " + className}>
            <Button>Open Playfrens</Button>
        </a>
    );
}
