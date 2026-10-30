import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useUserStore } from "@/stores";
import { Button, CardPageLayout } from "@/components";
import { PasswordResetForm } from "@/components/PasswordResetForm.jsx";
import { toastError } from "@/Utils";
import "./Login.css";
import "../components/common/CardPageLayout.css";

const INVALID_LINK = "That sign-in link is invalid or has expired.";

function readEmailParam() {
    const raw = window.location.search.match(/[?&]email=([^&]*)/)?.[1];
    try {
        return raw ? decodeURIComponent(raw) : "";
    } catch {
        return "";
    }
}

// Two links land here:
// - ?token_hash=...&type=... is the email template, only verified once the user clicks confirm (or saves a new password, for type=recovery which also has &email=)
// - #access_token=... the Supabase's default /verify redirect, handed straight to the backend.
const EmailCallback = observer(() => {
    const userStore = useUserStore();
    /** @type {"pending"|"confirm"|"reset"|"failed"} */
    const [status, setStatus] = useState("pending"); // "pending" | "confirm" | "reset" | "failed"
    const [submitting, setSubmitting] = useState(false);
    const hasStarted = useRef(false);

    const query = new URLSearchParams(window.location.search);
    const tokenHash = query.get("token_hash");
    const type = query.get("type");

    useEffect(() => {
        // Avoids double invokes effects especially in StrictMode, this call isn't safe to fire twice.
        if (hasStarted.current) return;
        hasStarted.current = true;

        if (tokenHash) {
            setStatus(type === "recovery" ? "reset" : "confirm");
            return;
        }

        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");

        if (!accessToken) {
            toastError(params.get("error_description") || INVALID_LINK);
            setStatus("failed");
            return;
        }

        userStore.completeMagicLinkSession(accessToken).then((result) => {
            if (!result.ok) {
                toastError(result.error || INVALID_LINK);
                setStatus("failed");
            }
        });
    }, [userStore, tokenHash, type]);

    async function handleConfirm() {
        if (submitting) return;
        setSubmitting(true);
        const result = await userStore.verifyEmailToken(tokenHash, type);
        if (!result.ok) {
            toastError(result.error || INVALID_LINK);
            setStatus("failed");
        }
        setSubmitting(false);
    }

    if (userStore.userInfo) return <Navigate to="/app" replace />;
    if (status === "failed") return <Navigate to="/login?failed=true" replace />;
    if (status === "reset") {
        return (
            <PasswordResetForm
                tokenHash={tokenHash}
                email={readEmailParam()}
                onInvalidLink={() => setStatus("failed")}
            />
        );
    }
    if (status === "confirm") {
        return (
            <CardPageLayout title="Confirm your email" subtitle="to finish signing in">
                <div className="email-auth-form">
                    <Button onClick={handleConfirm} disabled={submitting}>
                        {submitting ? "Confirming..." : "Confirm email"}
                    </Button>
                </div>
            </CardPageLayout>
        );
    }
    return <div className="loading-page">Signing you in...</div>;
});

export default EmailCallback;
