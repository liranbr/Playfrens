import { EmblaCarousel } from "@/components/EmblaCarousel.jsx";
import { usePageMeta } from "@/hooks/usePageMeta.js";
import "./Home.css";

export default function Home() {
    usePageMeta({ path: "/" });

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
                                <a
                                    href="https://discord.gg/aTdwEGau4Q"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Discord
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/liranbr/Playfrens"
                                    target="_blank"
                                    rel="noopener noreferrer"
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
                            <h2>Find</h2>
                            <p>
                                Find more options to play for any combination of friends - rather
                                than the usual couple of games, you could finally continue the co-op
                                that you started that one time!
                            </p>
                        </div>
                        <div className="topic">
                            <h2>Plan</h2>
                            <p>
                                You can also add games you don&apos;t have yet, or that haven&apos;t
                                released yet, to plan ahead with friends
                                <br />
                                <br />
                                If you&apos;re looking forward to some release date, or when a
                                friend will have free time, you can add Reminders
                            </p>
                        </div>
                        <div className="topic">
                            <h2>Steam Import</h2>
                            <p>
                                Optionally import your Games and Friends from Steam, and keep them
                                synced
                            </p>
                        </div>
                        <div className="topic">
                            <h2>Free and Open Source</h2>
                            <p>
                                Playfrens is free to use. No paywalls, no ads, no data shared or
                                sold. The code is public on GitHub, under active development
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
