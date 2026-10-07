import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { useUserStore } from "@/stores";
import { Button, CardPageLayout } from "@/components";
import { toastError } from "@/Utils";

// Only signs in on click.
export const GuestLinkForm = observer(({ targetBoard, token, onExit }) => {
    const userStore = useUserStore();
    const [guest, setGuest] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        let cancelled = false;
        userStore.getGuestLinkInfo(targetBoard, token).then((result) => {
            if (cancelled) return;
            if (!result.ok) toastError(result.error);
            // Broken link, or already signed in as this guest.
            if (!result.ok || result.guest.id === userStore.userInfo?.id) return onExit();
            setGuest(result.guest);
        });
        return () => {
            cancelled = true;
        };
    }, [userStore, targetBoard, token, onExit]);

    async function handleContinue() {
        if (submitting) return;
        setSubmitting(true);
        const result = await userStore.loginWithGuestLink(targetBoard, token);
        if (!result.ok) {
            toastError(result.error);
            setSubmitting(false);
            return;
        }
        // Full reload to start fresh as the guest.
        window.location.replace(`/app/${targetBoard}`);
    }

    if (!guest) return <div className="loading-page">Loading...</div>;

    return (
        <CardPageLayout title={`Join as ${guest.displayName}`} subtitle="using your login link">
            <div className="email-auth-form">
                {userStore.userInfo && (
                    <small>
                        You&apos;re signed in as {userStore.userInfo.displayName}, continuing will
                        sign you out of it.
                    </small>
                )}
                <Button onClick={handleContinue} disabled={submitting}>
                    Continue as {guest.displayName}
                </Button>
            </div>
            <div className="email-auth-toggles">
                <button type="button" className="link-like" onClick={onExit}>
                    {userStore.userInfo
                        ? `Stay signed in as ${userStore.userInfo.displayName}`
                        : "Sign in with a password instead"}
                </button>
            </div>
        </CardPageLayout>
    );
});
