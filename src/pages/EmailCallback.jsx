import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useUserStore } from "@/stores";
import { toastError } from "@/Utils";

// Supabase redirects here with tokens in the URL fragment; parse client-side and hand off to the backend.
const EmailCallback = observer(() => {
    const userStore = useUserStore();
    const [status, setStatus] = useState("pending"); // "pending" | "failed"
    const hasStarted = useRef(false);

    useEffect(() => {
        // Avoids double invokes effects especially in StrictMode, this call isn't safe to fire twice.
        if (hasStarted.current) return;
        hasStarted.current = true;

        const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");

        if (!accessToken) {
            toastError("That sign-in link is invalid or has expired.");
            setStatus("failed");
            return;
        }

        userStore.completeMagicLinkSession(accessToken).then((result) => {
            if (!result.ok) {
                toastError(result.error || "That sign-in link is invalid or has expired.");
                setStatus("failed");
            }
        });
    }, [userStore]);

    if (userStore.userInfo) return <Navigate to="/app" replace />;
    if (status === "failed") return <Navigate to="/login?failed=true" replace />;
    return <div className="loading-page">Signing you in...</div>;
});

export default EmailCallback;

