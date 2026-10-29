import { useState } from "react";
import { observer } from "mobx-react-lite";
import { BiArrowBack, BiLogoDiscordAlt, BiLogoGoogle, BiLogoSteam } from "react-icons/bi";
import { useUserStore } from "@/stores";
import { Button, CardPageLayout } from "@/components";
import { loadFromStorage, toastError, toastInfo } from "@/Utils";
import { ErrorCode } from "#shared/http.js";

const PROVIDERS = [
    { id: "steam", label: "Steam", icon: <BiLogoSteam />, color: "#171a21" },
    { id: "google", label: "Google", icon: <BiLogoGoogle />, color: "#c62828" },
    { id: "discord", label: "Discord", icon: <BiLogoDiscordAlt />, color: "#5865f2" },
];

export const AccountAuthForm = observer(({ targetBoard, onGuestModeClick }) => {
    const userStore = useUserStore();
    const lastAuth = loadFromStorage("last-auth-used", "");

    const [mode, setMode] = useState("login"); // "login" | "signup"
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [inEmailForm, setInEmailForm] = useState(false);
    // Signed up or tried logging in, but the account's email isn't confirmed yet.
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
    const [resending, setResending] = useState(false);

    async function handleResend() {
        if (resending) return;
        setResending(true);
        try {
            const result = await userStore.resendConfirmation(email);
            if (result.ok) toastInfo("Confirmation email sent, check your inbox and spam folder.");
            else toastError(result.error);
        } finally {
            setResending(false);
        }
    }

    function startSignUp() {
        setMode("signup");
        setInEmailForm(true);
    }

    function handleBack() {
        setMode("login");
        setInEmailForm(false);
        setAwaitingConfirmation(false);
        setPassword("");
    }

    function toggleMode() {
        setMode(mode === "signup" ? "login" : "signup");
    }

    async function handleEmailSubmit(e) {
        e.preventDefault();
        if (submitting) return;

        if (!inEmailForm) {
            setSubmitting(true);
            try {
                const result = await userStore.checkEmailExists(email);
                if (!result.ok) {
                    toastError(result.error);
                    return;
                }
                setMode(result.exists ? "login" : "signup");
                setInEmailForm(true);
            } finally {
                setSubmitting(false);
            }
            return;
        }

        setSubmitting(true);
        try {
            if (mode === "signup") {
                const result = await userStore.signupWithEmail(email, password, targetBoard);
                if (!result.ok) toastError(result.error);
                else if (result.confirmationRequired) setAwaitingConfirmation(true);
            } else {
                const result = await userStore.loginWithEmail(email, password, targetBoard);
                if (result.code === ErrorCode.EMAIL_NOT_CONFIRMED) setAwaitingConfirmation(true);
                else if (!result.ok) toastError(result.error);
            }
        } finally {
            setSubmitting(false);
        }
    }

    const SignInView = (
        <CardPageLayout title="Sign in" subtitle="to use Playfrens">
            <form className="email-auth-form" onSubmit={handleEmailSubmit}>
                <fieldset>
                    <div className="field-label-row">
                        <label htmlFor="email">Email</label>
                        {lastAuth === "email" && <span className="last-used-badge">Last used</span>}
                    </div>
                    <input
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </fieldset>
                <Button type="submit" disabled={submitting}>
                    Continue
                </Button>
            </form>

            <div className="login-divider">Or continue with</div>

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
                <button type="button" className="link-like">
                    {/* TODO: write handler */}
                    Have a guest account on a board?
                </button>
            </div>
        </CardPageLayout>
    );

    const EmailSignInView = (
        <CardPageLayout title="Sign in">
            <button type="button" className="link-like back-button" onClick={handleBack}>
                <BiArrowBack />
                Back
            </button>
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

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </fieldset>
                <Button type="submit" disabled={submitting}>
                    Sign in
                </Button>
            </form>

            <div className="email-auth-toggles">
                <button type="button" className="link-like">
                    {/* TODO: "forgot password" doesn't do anything yet */}
                    Forgot password?
                </button>
            </div>
        </CardPageLayout>
    );

    const EmailSignUpView = (
        <CardPageLayout title="Create an Account">
            <button type="button" className="link-like back-button" onClick={handleBack}>
                <BiArrowBack />
                Back
            </button>
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

                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </fieldset>

                <Button type="submit" disabled={submitting}>
                    Create account
                </Button>
            </form>
        </CardPageLayout>
    );

    const AwaitingConfirmationView = (
        <CardPageLayout title="Check your email" subtitle="to confirm your account">
            <button type="button" className="link-like back-button" onClick={handleBack}>
                <BiArrowBack />
                Back
            </button>
            <div className="email-auth-form">
                <p className="email-confirm-notice">
                    We sent a confirmation link to <strong>{email}</strong>. It can take a few
                    minutes, and might end up in your spam folder.
                </p>
                <Button onClick={handleResend} disabled={resending}>
                    Resend confirmation email
                </Button>
            </div>
        </CardPageLayout>
    );

    if (awaitingConfirmation) return AwaitingConfirmationView;
    if (!inEmailForm) return SignInView;
    else if (mode === "login") return EmailSignInView;
    else if (mode === "signup") return EmailSignUpView;
    return SignInView;
});
