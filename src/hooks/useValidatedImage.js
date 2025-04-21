import { useEffect, useState } from "react";

function validateImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);      // Valid image
        img.onerror = () => resolve(false);    // Broken image
        img.src = url;
    });
}

export function useValidatedImage(src, fallback = "/missing_game_cover.png") {
    const [validSrc, setValidSrc] = useState(src);

    useEffect(() => {
        let cancelled = false;
        validateImage(src).then((isValid) => {
            if (!cancelled) {
                setValidSrc(isValid ? src : fallback);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [src, fallback]);

    return validSrc;
}