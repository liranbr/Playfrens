import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useUserStore } from "@/stores";
import { Button, CardPageLayout } from "@/components";
import { toastError, toastSuccess } from "@/Utils";
import { ErrorCode } from "#shared/http.js";

// Opened from the reset email, the link is only used up once the new password is submitted.
export const PasswordResetForm = observer(({ tokenHash, email, onInvalidLink }) => {
    const userStore = useUserStore();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    // Set when Supabase rejects the password, the backend still remembers the link for retries.
    const [linkUsed, setLinkUsed] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        if (submitting) return;
        if (password !== confirmPassword) return toastError("Passwords don't match.");

        setSubmitting(true);
        const result = await userStore.resetPassword(linkUsed ? null : tokenHash, password, email);
        setSubmitting(false);
        if (result.ok) return toastSuccess("Password updated.", "", { personal: true });

        toastError(result.error);
        if (result.code === ErrorCode.PASSWORD_REJECTED) setLinkUsed(true);
        else onInvalidLink();
    }

    return (
        <CardPageLayout title="Reset password" subtitle="choose a new one">
            <form className="email-auth-form" onSubmit={handleSubmit}>
                <fieldset>
                    {/* For password managers, readOnly since some skip disabled fields. */}
                    {email && (
                        <>
                            <label htmlFor="reset-email">Email</label>
                            <input
                                id="reset-email"
                                type="email"
                                autoComplete="username"
                                value={email}
                                readOnly
                            />
                        </>
                    )}

                    <label htmlFor="new-password">New password</label>
                    <input
                        id="new-password"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <label htmlFor="confirm-password">Confirm new password</label>
                    <input
                        id="confirm-password"
                        type="password"
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </fieldset>
                <Button type="submit" disabled={submitting}>
                    {submitting ? "Saving..." : "Save password"}
                </Button>
            </form>
        </CardPageLayout>
    );
});
