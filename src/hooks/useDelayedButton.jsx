import { useState, useEffect, useCallback } from "react";

export function useDelayedButton(delaySeconds) {
    const [delayStarted, setDelayStarted] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(delaySeconds);
    const [delayDone, setDelayDone] = useState(false);

    useEffect(() => {
        if (!delayStarted || delayDone) return;

        if (secondsRemaining <= 0) {
            setDelayDone(true);
            return;
        }

        const timeout = setTimeout(() => {
            setSecondsRemaining((seconds) => seconds - 1);
        }, 1000);

        return () => clearTimeout(timeout);
    }, [delayStarted, delayDone, secondsRemaining]);

    const startDelay = useCallback(() => {
        setSecondsRemaining(delaySeconds);
        setDelayDone(false);
        setDelayStarted(true);
    }, [delaySeconds]);

    const delayOngoing = delayStarted && !delayDone;

    return { startDelay, delayStarted, delayOngoing, secondsRemaining, delayDone };
}
