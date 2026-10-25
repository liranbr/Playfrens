import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@/components";
import { globalDataStore, userStore } from "@/stores";
import { tagTypes } from "@/models";
import { HttpStatus } from "#shared/http.js";
import { toastError, toastSuccess } from "@/Utils";

const PROVIDER_LABELS = {
    steam: "Steam",
    google: "Google",
    discord: "Discord",
    email: "Email",
};

export const AccountTab = observer(() => {
    const { userInfo } = userStore;
    return (
        <>
            <dl className="account-info">
                <dt>Display Name</dt>
                <dd>{userInfo?.displayName}</dd>
                <dt>Sign-in Method</dt>
                <dd>{userInfo?.isGuest ? "Guest" : PROVIDER_LABELS[userInfo?.provider]}</dd>
            </dl>
            <dl className="account-stats">
                <dt>Data</dt>
                <dd className="account-data-table">
                    <label>Created:</label>
                    <p>{userInfo?.createdAt.toLocaleDateString()}</p>
                    <label>Games:</label>
                    <p>{globalDataStore.allGames.size}</p>
                    <label>Friends:</label>
                    <p>{globalDataStore.allTags[tagTypes.friend].size}</p>
                </dd>
            </dl>

            {!userInfo.isGuest && <DeleteAccountButton />}
        </>
    );
});

const DEBUGGING_SKIP_ACCOUNT_DELETION_WARNING = false;
const DeleteAccountButton = () => {
    const WARNING_DURATION_SECONDS = 10;
    const [startedCountdown, setStartedCountdown] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(
        DEBUGGING_SKIP_ACCOUNT_DELETION_WARNING ? 1 : WARNING_DURATION_SECONDS,
    );
    const [countdownCleared, setCountdownCleared] = useState(false);
    useEffect(() => {
        if (startedCountdown) {
            const countdownInterval = setInterval(() => {
                if (secondsRemaining <= 0) {
                    setSecondsRemaining(0);
                    clearInterval(countdownInterval);
                    setCountdownCleared(true);
                }

                setSecondsRemaining(secondsRemaining - 1);
            }, 1000);

            return () => clearInterval(countdownInterval);
        }
    }, [secondsRemaining, startedCountdown]);
    const deleteAccountFunction = async () => {
        try {
            const response = await fetch("/auth/deleteAccount", {
                method: "DELETE",
                credentials: "include",
            });
            if (response.status === HttpStatus.OK) {
                toastSuccess("Account Deleted successfully. Reloading..", "", { personal: true });
                setTimeout(() => window.location.reload(), 3000);
            } else {
                console.error("Failed to delete Account: ", response);
                toastError("Failed to delete Account");
            }
        } catch (err) {
            console.error("Failed to delete Account:", err);
            toastError("Failed to delete Account");
        }
    };
    const confirmMessage =
        secondsRemaining > 0 ? `Are you sure? (${secondsRemaining})` : "Yes, Delete Account";
    return startedCountdown ? (
        <Button variant="danger" disabled={!countdownCleared} onClick={deleteAccountFunction}>
            {confirmMessage}
        </Button>
    ) : (
        <Button variant="danger-secondary" onClick={() => setStartedCountdown(true)}>
            Delete Account
        </Button>
    );
};
