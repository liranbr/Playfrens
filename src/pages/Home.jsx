import { useNavigate } from "react-router-dom";
import { Button } from "@/components";
import "./Home.css";

export default function Home() {
    const navigate = useNavigate();
    return (
        <div id="home">
            <div className="home-body">
                <h1>This will be a homepage</h1>
                <span>where we'll show how cool the app is 😎</span>
                <Button onClick={() => navigate("/login")}>Open Playfrens</Button>
            </div>
        </div>
    );
}
