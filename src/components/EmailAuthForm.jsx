import { useState } from "react";
import { observer } from "mobx-react-lite";
import { BiArrowBack, BiLogoDiscordAlt, BiLogoGoogle, BiLogoSteam } from "react-icons/bi";
import { useUserStore } from "@/stores";
import { Button, CardPageLayout } from "@/components";
import { loadFromStorage, toastError, toastInfo } from "@/Utils";

const PROVIDERS = [
    { id: "steam", label: "Steam", icon: <BiLogoSteam />, color: "#171a21" },
    { id: "google", label: "Google", icon: <BiLogoGoogle />, color: "#c62828" },
    { id: "discord", label: "Discord", icon: <BiLogoDiscordAlt />, color: "#5865f2" },
];

export const EmailAuthForm = observer(({ targetBoard, onGuestModeClick }) => {
    const userStore = useUserStore();
    const lastAuth = loadFromStorage("last-auth-used", "");

    const [mode, setMode] = useState("login"); // "login" | "signup"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [emailConfirmed, setEmailConfirmed] = useState(false);

    function startSignUp() {
        setMode("signup");
        setEmailConfirmed(true);
    }

    function handleBack() {
        setMode("login");
        setEmailConfirmed(false);
        setPassword("");
    }

    function toggleMode() {
        setMode(mode === "signup" ? "login" : "signup");
    }

    async function handleEmailSubmit(e) {
        e.preventDefault();
        if (submitting) return;

        if (!emailConfirmed) {
            setSubmitting(true);
            try {
                const result = await userStore.checkEmailExists(email);
                if (!result.ok) {
                    toastError(result.error);
                    return;
                }
                setMode(result.exists ? "login" : "signup");
                setEmailConfirmed(true);
            } finally {
                setSubmitting(false);
            }
            return;
        }

        setSubmitting(true);
        try {
            if (mode === "signup") {
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
        <CardPageLayout
            title={mode === "signup" ? "Create Account" : "Sign in"}
            subtitle="to use Playfrens"
        >
            <form className="email-auth-form" onSubmit={handleEmailSubmit}>
                <fieldset>
                    <div className="field-label-row">
                        <label htmlFor="email">Email</label>
                        {lastAuth === "email" && !emailConfirmed && mode !== "signup" && (
                            <span className="last-used-badge">Last used</span>
                        )}
                    </div>
                    <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    {emailConfirmed && (
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
                <Button type="submit" disabled={submitting}>
                    {!emailConfirmed
                        ? "Continue"
                        : mode === "signup"
                            ? "Create account"
                            : "Sign in"}
                </Button>
            </form>

            {emailConfirmed ? (
                <>
                    <button type="button" className="link-like back-button" onClick={handleBack}>
                        <BiArrowBack />
                        Back
                    </button>

                    <div className="email-auth-toggles">
                        <button type="button" className="link-like" onClick={toggleMode}>
                            {mode === "signup" ? "Sign in" : "Create account"}
                        </button>
                        {mode !== "signup" && (
                            // TODO: "forgot password" doesn't do anything yet
                            <button type="button" className="link-like">
                                Forgot password?
                            </button>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="login-divider">
                        <span>Or continue with</span>
                    </div>

                    <div className="auth-buttons">
                        {PROVIDERS.map(({ id, label, icon, color }) => (
                            <Button
                                key={id}
                                variant="secondary"
                                className={lastAuth === id ? "last-auth" : ""}
                                style={{ "--pf-btn-hover": color }}
                                onClick={() => userStore.login(id, targetBoard)}
                            >
                                {icon}
                                {label}
                            </Button>
                        ))}
                    </div>

                    <div className="email-auth-toggles">
                        <button type="button" className="link-like" onClick={startSignUp}>
                            Create account
                        </button>
                        {/* TODO: no "forgot password" work yet */}
                        <button type="button" className="link-like">
                            Forgot password?
                        </button>
                    </div>

                    <div className="email-auth-toggles">
                        <button type="button" className="link-like" onClick={onGuestModeClick}>
                            Sign in with a board login instead?
                        </button>
                    </div>
                </>
            )}
        </CardPageLayout>
    );
});
