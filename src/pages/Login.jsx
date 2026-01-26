import { Link, Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { BiLogoDiscordAlt, BiLogoGoogle, BiLogoSteam } from "react-icons/bi";
import { useUserStore } from "@/stores";
import { Button, SimpleTooltip } from "@/components";
import "./Login.css";
import { loadFromStorage } from "@/Utils.jsx";

export const Login = observer(() => {
    // TODO: handle '/login?failed=true' in the url
    const userStore = useUserStore();
    const { loading, userInfo } = userStore;
    const lastAuth = loadFromStorage("last-auth-used", "");

    if (loading) return <div className="loading-page">Loading...</div>;
    if (userInfo) return <Navigate to="/app" replace />;

    return (
        <div id="login">
            <div className="login-body">
                <div className="login-header">
                    <h1>Sign in</h1>
                    <span>to use Playfrens</span>
                </div>
                <div className="auth-buttons">
                    <Button
                        variant="secondary"
                        className={lastAuth === "steam" ? "last-auth" : ""}
                        onClick={() => userStore.login("steam")}
                    >
                        <BiLogoSteam />
                        Continue with Steam
                    </Button>
                    <Button
                        variant="secondary"
                        className={lastAuth === "google" ? "last-auth" : ""}
                        onClick={() => userStore.login("google")}
                    >
                        <BiLogoGoogle />
                        Continue with Google
                    </Button>
                    <Button
                        variant="secondary"
                        className={lastAuth === "discord" ? "last-auth" : ""}
                        onClick={() => userStore.login("discord")}
                    >
                        <BiLogoDiscordAlt />
                        Continue with Discord
                    </Button>
                </div>
                <div className="login-footer">
                    <a href="/privacy">Privacy Policy</a>
                    {/* TODO: come to terms with needing to get a privacy policy */}
                </div>
            </div>
            <Link to="/" className="app-brand">
                <img src="/Playfrens_Logo.png" alt="Playfrens Logo" />
                Playfrens
            </Link>
        </div>
    );
});

export default Login;
