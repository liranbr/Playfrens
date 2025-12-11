import { useNavigate } from "react-router-dom";
import { Button } from "@/components";
import "./Home.css";

export default function Home() {
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
                <h1>This will be a homepage</h1>
                <span>where we'll show how cool the app is 😎</span>
                <OpenPlayfrens />
            </div>
        </div>
    );
}

function OpenPlayfrens() {
    const navigate = useNavigate();
    return (
        <Button className="open-playfrens" onClick={() => navigate("/login")}>
            Open Playfrens
        </Button>
    );
}
