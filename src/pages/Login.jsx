import "./Login.css";
import { Button, SimpleTooltip } from "@/components";
import { BiLogoDiscordAlt, BiLogoGoogle, BiLogoSteam } from "react-icons/bi";
import { Link } from "react-router-dom";
import { backupToFile } from "@/stores/index.js";

export default function Login() {
    return (
        <div id="login">
            <div className="login-body">
                <div className="login-header">
                    <h1>Sign in</h1>
                    <span>to use Playfrens</span>
                </div>
                {/* TODO: make login buttons work, and they then route you to /app */}
                {/* TODO: after testers backup, remove the button */}
                <div className="continue-with">
                    <div className="auth-buttons">
                        <Button variant="danger" onClick={backupToFile}>
                            (Testers - Backup local data before logging in)
                        </Button>
                        <Button variant="secondary">
                            <BiLogoSteam />
                            Continue with Steam
                        </Button>
                        <Button variant="secondary">
                            <BiLogoGoogle />
                            Continue with Google
                        </Button>
                        <Button variant="secondary">
                            <BiLogoDiscordAlt />
                            Continue with Discord
                        </Button>
                    </div>
                </div>
                <div className="login-footer">
                    <SimpleTooltip message="WIP" delayDuration={0}>
                        <a>Privacy</a>
                    </SimpleTooltip>
                    <SimpleTooltip message="WIP" delayDuration={0}>
                        <a>Terms</a>
                    </SimpleTooltip>
                    {/* TODO: come to terms with needing to get a privacy policy */}
                </div>
            </div>
            <Link to="/" className="app-brand">
                <img src="/Playfrens_Logo.png" alt="Playfrens Logo" />
                Playfrens
            </Link>
        </div>
    );
}
