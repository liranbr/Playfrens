import { useNavigate } from "react-router-dom";
import { Button, SimpleTooltip } from "@/components";
import "./Home.css";

export function Home() {
    return (
        <div id="home">
            <div className="sticky-header">
                <div className="home-container header-content">
                    <div className="header-left">
                        <div className="app-brand">
                            <img src="/Playfrens_Logo.png" alt="Playfrens Logo" />
                            Playfrens
                        </div>
                        <ul className="nav-links">
                            <li>
                                <SimpleTooltip message="working on it ^^'" delayDuration={0}>
                                    <a href="/">Discord</a>
                                </SimpleTooltip>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/liranbr/Playfrens"
                                    target="_blank"
                                    aria-disabled
                                >
                                    GitHub
                                </a>
                            </li>
                        </ul>
                    </div>
                    <div className="header-right">
                        <OpenPlayfrens />
                    </div>
                </div>
            </div>

            <div className="home-body">
                <div className="main-content">
                    <div className="hero">
                        <h1>So what are we playing?</h1>
                        <p>
                            Playfrens helps you play with friends. Manage your games library to
                            find, plan, and play together!
                        </p>
                        <OpenPlayfrens className="main-action" />
                    </div>
                    <div className="media">{"<some gif or screenshot here>"}</div>
                </div>
                <div className="home-footer">
                    <ul className="nav-links">
                        <li>
                            <a href="/contact">Contact</a>
                        </li>
                        <li>
                            <a href="/privacy">Privacy</a>
                        </li>
                    </ul>
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
