import { useNavigate } from "react-router-dom";
import { Button, EmblaCarousel, SimpleTooltip } from "@/components";
import "./Home.css";

export function Home() {
    return (
        <div id="home">
            <div className="sticky-header">
                <div className="header-content home-container">
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
                        <a href="/app" className="open-playfrens" draggable={false}>
                            Open Playfrens
                        </a>
                    </div>
                </div>
            </div>

            <div className="home-body">
                <div className="main-content home-container">
                    <div className="hero">
                        <h1>So what are we playing?</h1>
                        <p>
                            Playfrens helps you play with friends. Manage your games library to
                            find, plan, and play together!
                        </p>
                        <a href="/app" className="open-playfrens main-action" draggable={false}>
                            Open Playfrens
                        </a>
                    </div>
                    {/*<EmblaCarousel slides={[0, 1, 2, 3, 4]} options={{ loop: true }} />*/}
                    <div className="media-carousel">{"<some embla carousel here>"}</div>
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
