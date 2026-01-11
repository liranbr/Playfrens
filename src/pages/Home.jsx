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
                    <EmblaCarousel />
                    <div className="topics">
                        <div className="topic">
                            <h2>Lorem ipsum dolor sit amet</h2>
                            <p>
                                Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris
                                nisi ut aliquip ex ea commodo consequat.
                            </p>
                        </div>
                        <div className="topic">
                            <h2>Consectetur adipiscing elit</h2>
                            <p>
                                Duis aute irure dolor in reprehenderit in voluptate velit esse
                                cillum dolore eu fugiat nulla pariatur.
                            </p>
                        </div>
                        <div className="topic">
                            <h2>Sed ut perspiciatis unde</h2>
                            <p>
                                Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et
                                quasi architecto beatae vitae dicta sunt explicabo.
                            </p>
                        </div>
                        <div className="topic">
                            <h2>Omnis iste natus error sit</h2>
                            <p>
                                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut
                                fugit, sed quia consequuntur magni dolores eos qui ratione
                                voluptatem sequi nesciunt.
                            </p>
                        </div>
                    </div>
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
