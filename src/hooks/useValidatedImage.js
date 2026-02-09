import { useEffect, useState } from "react";
import { tryLoadImage } from "@/Utils.jsx";

export function useValidatedImage(srcURL, fallback = "/missing_game_cover.png") {
    const [validSrc, setValidSrc] = useState(srcURL);

    useEffect(() => {
        let canceled = false;

        if (!srcURL) {
            setValidSrc(fallback);
            return;
        }

        tryLoadImage(srcURL).then((ok) => {
            if (!canceled) setValidSrc(ok ? srcURL : fallback); // setting srcURL again to prevent stale state
        });

        return () => {
            canceled = true; // operation was canceled before image validation completed
        };
    }, [srcURL, fallback]);

    return validSrc;
}
