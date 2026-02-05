import { useValidatedImage } from "@/hooks/useValidatedImage.js";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import "./GameCoverImage.css";

export const GameCoverImage = observer(({ src, validate = true, ...rest }) => {
    const [loaded, setLoaded] = useState(false);
    const gameCover = validate ? useValidatedImage(src) : src;
    const handleLoaded = () => setLoaded(true);
    const sharedProps = {
        src: gameCover,
        style: { opacity: loaded ? "100%" : "0%" },
        draggable: false,
        onLoad: handleLoaded,
        onError: handleLoaded,
        ...rest,
    };
    const coverDisplay = gameCover.includes(".webm") ? (
        <video {...sharedProps} onPlay={handleLoaded} autoPlay loop muted />
    ) : (
        <img {...sharedProps} referrerPolicy="no-referrer" alt="Game Cover Art" loading="lazy" />
    );
    // coverDisplay unconditionally rendered, because it needs to start loading for onLoad/onPlay
    return (
        <>
            {coverDisplay}
            {!loaded && <div className="cover-skeleton" />}
        </>
    );
});
