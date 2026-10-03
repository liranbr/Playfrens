import { useState } from "react";
import { observer } from "mobx-react-lite";
import { BiArrowBack } from "react-icons/bi";
import { useUserStore } from "@/stores";
import { Button, CardPageLayout } from "@/components";
import { toastError } from "@/Utils";

export const GuestAuthForm = observer(({ targetBoard, defaultUsername, onBack }) => {
    const userStore = useUserStore();

    const [guestUsername, setGuestUsername] = useState(defaultUsername ?? "");
    const [guestPassword, setGuestPassword] = useState("");
    const [guestBoardInput, setGuestBoardInput] = useState("");
    const [guestSubmitting, setGuestSubmitting] = useState(false);

    async function handleGuestSubmit(e) {
        e.preventDefault();
        if (guestSubmitting) return;
        setGuestSubmitting(true);
        try {
            const board = targetBoard || guestBoardInput;
            const result = await userStore.loginAsGuest(guestUsername, guestPassword, board);
            if (!result.ok) toastError(result.error);
        } finally {
            setGuestSubmitting(false);
        }
    }

    return (
        <CardPageLayout
            title={targetBoard ? "Sign in to access this board" : "Sign in with a board login"}
            subtitle="using a login someone created for you"
        >
            <form className="email-auth-form" onSubmit={handleGuestSubmit}>
                <fieldset>
                    {/* Ask only if not known from the link that pasted, else input it manually */}
                    {!targetBoard && (
                        <>
                            <label htmlFor="guest-board">
                                Board link or code
                                <br />
                                <small>Ask whoever gave you this login for it.</small>
                            </label>
                            <input
                                id="guest-board"
                                required
                                placeholder="e.g. dsaghj or the full link"
                                value={guestBoardInput}
                                onChange={(e) => setGuestBoardInput(e.target.value)}
                            />
                        </>
                    )}
                    <label htmlFor="guest-username">Username</label>
                    <input
                        id="guest-username"
                        required
                        autoComplete="username"
                        value={guestUsername}
                        onChange={(e) => setGuestUsername(e.target.value)}
                    />
                    <label htmlFor="guest-password">Password</label>
                    <input
                        id="guest-password"
                        type="password"
                        required
                        autoComplete="current-password"
                        value={guestPassword}
                        onChange={(e) => setGuestPassword(e.target.value)}
                    />
                </fieldset>
                <Button type="submit" disabled={guestSubmitting}>
                    Sign in
                </Button>
            </form>
            <button type="button" className="link-like back-button" onClick={onBack}>
                <BiArrowBack />
                Back
            </button>
        </CardPageLayout>
    );
});
