import "./Login.css";
import { Button, SimpleTooltip } from "@/components/index.js";
import { BiLogoDiscordAlt, BiLogoGoogle, BiLogoSteam } from "react-icons/bi";

export default function Login() {
    return (
        <div id="login">
            <div className="login-body">
                <h1>Sign in</h1>
                <div className="continue-with">
                    <span>Continue with</span>
                    <div className="auth-buttons">
                        <Button variant="secondary">
                            <BiLogoSteam />
                            Steam
                        </Button>
                        <Button variant="secondary">
                            <BiLogoGoogle />
                            Google
                        </Button>
                        <Button variant="secondary">
                            <BiLogoDiscordAlt />
                            Discord
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
        </div>
    );
}
