import { Link } from "react-router-dom";
import { BiLogoDiscordAlt, BiLogoGoogle, BiLogoSteam } from "react-icons/bi";
import { useUserStore } from "@/stores";
import { Button, SimpleTooltip } from "@/components";
import "./Login.css";

export default function Login() {
    const userStore = useUserStore();
    // TODO: handle '/login?failed=true' in the url
    // TODO: handle case when user is already logged in, reroute to /app

    return (
        <div id="login">
            <div className="login-body">
                <div className="login-header">
                    <h1>Sign in</h1>
                    <span>to use Playfrens</span>
                </div>
                <div className="continue-with">
                    <div className="auth-buttons">
                        <Button variant="secondary" onClick={() => userStore.login("steam")}>
                            <BiLogoSteam />
                            Continue with Steam
                        </Button>
                        <Button variant="secondary" onClick={() => userStore.login("google")}>
                            <BiLogoGoogle />
                            Continue with Google
                        </Button>
                        <Button variant="secondary" onClick={() => userStore.login("discord")}>
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
