import { useState } from "react";
import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { BiLogoDiscordAlt, BiLogoGoogle, BiLogoSteam } from "react-icons/bi";
import { useUserStore } from "@/stores";
import { Button } from "@/components";
import { usePageMeta } from "@/hooks/usePageMeta.js";
import "./Login.css";
import "./CardPage.css";
import { loadFromStorage, toastError, toastInfo, toastSuccess } from "@/Utils";

const Login = observer(() => {
    const userStore = useUserStore();
    const { loading, userInfo } = userStore;
    const lastAuth = loadFromStorage("last-auth-used", "");

    const [mode, setMode] = useState("login"); // "login" | "signup" | "magic"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [magicLinkSent, setMagicLinkSent] = useState(false);

    usePageMeta({
        title: "Sign in",
        description: "Sign in to Playfrens.",
        path: "/login",
        noindex: true,
    });

    if (loading) return <div className="loading-page">Loading...</div>;
    if (userInfo) return <Navigate to="/app" replace />;

    if (window.location.search.includes("failed=true")) toastError("Login failed.");

    function switchMode(nextMode) {
        setMode(nextMode);
        setMagicLinkSent(false);
    }

    async function handleEmailSubmit(e) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        try {
            if (mode === "magic") {
                const result = await userStore.sendMagicLink(email);
                if (result.ok) {
                    setMagicLinkSent(true);
                    toastSuccess("Magic link sent! Check your email.");
                } else {
                    toastError(result.error);
                }
            } else if (mode === "signup") {
                const result = await userStore.signupWithEmail(email, password);
                if (!result.ok) {
                    toastError(result.error);
                } else if (result.confirmationRequired) {
                    toastInfo("Check your email to confirm your account.");
                }
            } else {
                const result = await userStore.loginWithEmail(email, password);
                if (!result.ok) toastError(result.error);
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div id="card-page">
            <div className="card-page-body">
                <div className="card-page-header">
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

                <div className="login-divider">
                    <span>or</span>
                </div>

                {mode === "magic" && magicLinkSent ? (
                    <div className="magic-link-sent">
                        <p>
                            Check <strong>{email}</strong> for your sign-in link.
                        </p>
                        <button
                            type="button"
                            className="link-like"
                            onClick={() => setMagicLinkSent(false)}
                        >
                            Use a different email
                        </button>
                    </div>
                ) : (
                    <form className="email-auth-form" onSubmit={handleEmailSubmit}>
                        <fieldset>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            {mode !== "magic" && (
                                <>
                                    <label htmlFor="password">Password</label>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        autoComplete={
                                            mode === "signup" ? "new-password" : "current-password"
                                        }
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </>
                            )}
                        </fieldset>
                        <Button type="submit" className="btn" disabled={submitting}>
                            {mode === "magic"
                                ? "Send magic link"
                                : mode === "signup"
                                  ? "Create account"
                                  : "Sign in"}
                        </Button>
                        <div className="email-auth-toggles">
                            {mode !== "magic" && (
                                <button
                                    type="button"
                                    className="link-like"
                                    onClick={() => switchMode(mode === "signup" ? "login" : "signup")}
                                >
                                    {mode === "signup"
                                        ? "Already have an account? Sign in"
                                        : "Need an account? Sign up"}
                                </button>
                            )}
                            <button
                                type="button"
                                className="link-like"
                                onClick={() => switchMode(mode === "magic" ? "login" : "magic")}
                            >
                                {mode === "magic"
                                    ? "Use a password instead"
                                    : "Email me a sign-in link instead"}
                            </button>
                        </div>
                    </form>
                )}

                <div className="login-footer">
                    <a href="/privacy">Privacy Policy</a>
                </div>
            </div>
            <a href="/" className="app-brand">
                <img src="/Playfrens_Logo.png" alt="Playfrens Logo" />
                Playfrens
            </a>
        </div>
    );
});

export default Login;
