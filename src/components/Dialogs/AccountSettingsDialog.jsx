import { DialogBase } from "./DialogRoot.jsx";
import * as Dialog from "@radix-ui/react-dialog";
import "./AccountSettingsDialog.css";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/index.js";
import { globalDataStore, userStore } from "@/stores/index.js";
import { storeTypes, tagTypes } from "@/models/index.js";
import { useEffect, useState } from "react";

export const AccountSettingsDialog = ({ open, closeDialog }) => {
    const { userInfo } = userStore;
    return (
        <DialogBase
            open={open}
            onOpenChange={closeDialog}
            contentProps={{
                onOpenAutoFocus: (e) => {
                    e.preventDefault(); // Focuses the dialog content instead of the first interactable element
                    e.target.focus();
                },
                className: "rx-dialog account-settings-dialog",
            }}
        >
            <Dialog.Title>Account Settings</Dialog.Title>
            <VisuallyHidden>
                <Dialog.Description>Account information and settings</Dialog.Description>
            </VisuallyHidden>

            <dl className="account-info">
                <dt>Display Name</dt>
                <dd>{userInfo?.displayName}</dd>
                <dt>Sign-in Method</dt>
                <dd>{storeTypes[userInfo?.provider]}</dd>
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

            <DeleteAccountButton />

            <div className="rx-dialog-footer">
                <Button variant="secondary" onClick={closeDialog}>
                    Close
                </Button>
            </div>
        </DialogBase>
    );
};

const DeleteAccountButton = () => {
    const durationSeconds = 30;
    const [startedCountdown, setStartedCountdown] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);
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
    const confirmMessage =
        secondsRemaining > 0 ? `Are you sure? (${secondsRemaining})` : "Yes, Delete Account";
    return startedCountdown ? (
        <Button variant="danger" disabled={!countdownCleared}>
            {confirmMessage /* TODO: actually implement account deletion */}
        </Button>
    ) : (
        <Button variant="danger-secondary" onClick={() => setStartedCountdown(true)}>
            Delete Account
        </Button>
    );
};
