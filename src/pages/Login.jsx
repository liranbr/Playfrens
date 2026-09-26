import { useState } from "react";
import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { useUserStore } from "@/stores";
import { EmailAuthForm, GuestAuthForm } from "@/components";
import { usePageMeta } from "@/hooks/usePageMeta.js";
import "./Login.css";
import "./CardPage.css";
import { toastError } from "@/Utils";

const Login = observer(() => {
    const { loading, userInfo } = useUserStore();

    // Present when arriving via a shared board link; carried through every login path so you
    // land back on that board afterward.
    const params = new URLSearchParams(window.location.search);
    const targetBoard = params.get("board");
    const targetGuestName = params.get("guest");

    // Board Guest accounts log in with a username/password.
    const [guestMode, setGuestMode] = useState(!!targetBoard);

    usePageMeta({
        title: "Sign in",
        description: "Sign in to Playfrens.",
        path: "/login",
        noindex: true,
    });

    if (loading) return <div className="loading-page">Loading...</div>;
    if (userInfo) return <Navigate to={targetBoard ? `/app/${targetBoard}` : "/app"} replace />;

    if (window.location.search.includes("failed=true")) toastError("Login failed.");

    return guestMode ? (
        <GuestAuthForm
            targetBoard={targetBoard}
            defaultUsername={targetGuestName}
            onBack={() => setGuestMode(false)}
        />
    ) : (
        <EmailAuthForm targetBoard={targetBoard} onGuestModeClick={() => setGuestMode(true)} />
    );
});

export default Login;
