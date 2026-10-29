import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@/components";
import { globalDataStore, userStore } from "@/stores";
import { tagTypes } from "@/models";
import { HttpStatus } from "#shared/http.js";
import { toastError, toastSuccess } from "@/Utils";
import { useDelayedButton } from "@/hooks/useDelayedButton.jsx";

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
    const { startDelay, delayStarted, delayOngoing, secondsRemaining } = useDelayedButton(
        DEBUGGING_SKIP_ACCOUNT_DELETION_WARNING ? 1 : 10,
    );
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

    return !delayStarted ? (
        <Button variant="danger-secondary" onClick={startDelay}>
            Delete Account
        </Button>
    ) : (
        <Button variant="danger" disabled={delayOngoing} onClick={deleteAccountFunction}>
            {delayOngoing ? `Are you sure? (${secondsRemaining}s)` : "Yes, Delete Account"}
        </Button>
    );
};
