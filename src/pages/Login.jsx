import "./Login.css";
import { Button, SimpleTooltip } from "@/components/index.js";
import { BiLogoDiscordAlt, BiLogoGoogle, BiLogoSteam } from "react-icons/bi";
import { Link } from "react-router-dom";

export default function Login() {
    return (
        <div id="login">
            <div className="login-body">
                <div className="login-header">
                    <h1>Sign in</h1>
                    <span>to use Playfrens</span>
                </div>
                <div className="continue-with">
                    <div className="auth-buttons">
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
