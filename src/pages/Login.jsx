import "./Login.css";
import { Button } from "@/components/index.js";
import { BiLogoDiscordAlt, BiLogoGoogle, BiLogoSteam } from "react-icons/bi";

export default function Login() {
    return (
        <div id="login">
            <div className="login-body">
                <h1>Sign in</h1>
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
                <div className="login-footer">
                    <a>Privacy</a>
                    <a>Terms</a>
                    <a>(they do nothing yet)</a>
                    {/* TODO: come to terms with needing to get a privacy policy */}
                </div>
            </div>
        </div>
    );
}
