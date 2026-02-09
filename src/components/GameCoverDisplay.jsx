import { useValidatedImage } from "@/hooks/useValidatedImage.js";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import "./GameCoverDisplay.css";
import { Spinner } from "@/components/common/Spinner.jsx";

export const GameCoverDisplay = observer(
    ({ src, className = "", skeleton = true, spinner = false, ...rest }) => {
        const [loaded, setLoaded] = useState(false);
        const gameCover = useValidatedImage(src);
        const handleLoaded = (e) => {
            setLoaded(true);
        };
        const callTwoEvents = (a, b) => (e) => {
            a?.(e);
            b?.(e);
        };
        const sharedProps = {
            src: gameCover,
            className: "game-cover-display " + className,
            style: { opacity: loaded ? "100%" : "0%" },
            draggable: false,
            ...rest,
            onLoad: callTwoEvents(rest.onLoad, handleLoaded),
            onError: callTwoEvents(rest.onError, handleLoaded),
        };
        const coverDisplay = gameCover.includes(".webm") ? (
            <video {...sharedProps} onPlay={handleLoaded} autoPlay loop muted />
        ) : (
            <img
                {...sharedProps}
                referrerPolicy="no-referrer"
                alt="Game Cover Art"
                loading="lazy"
            />
        );
        // coverDisplay unconditionally rendered, because it needs to start loading for onLoad/onPlay
        return (
            <>
                {coverDisplay}
                {skeleton && !loaded && <div className="cover-skeleton" />}
                {spinner && !loaded && <Spinner />}
            </>
        );
    },
);
