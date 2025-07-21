import { useEffect, useState } from "react";

function validateImage(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true); // Valid image
        img.onerror = () => resolve(false); // Broken image
        img.src = url;
    });
}

export function useValidatedImage(src, fallback = "/missing_game_cover.png") {
    const [validSrc, setValidSrc] = useState(src);

    useEffect(() => {
        let cancelled = false;

        const sources = [];
        if (src.includes("cdn2.steamgriddb.com/thumb/")) {
            // try to find the actual image rather than the thumbnail
            const gridSrc = src.replace("/thumb/", "/grid/");
            sources.push(gridSrc);
            sources.push(gridSrc.replace(".jpg", ".png"));
            sources.push(gridSrc.replace(".jpg", ".webp"));
            sources.push(gridSrc.replace(".webm", ".webp"));
            sources.push(gridSrc.replace(".webm", ".png"));
        }
        sources.push(src);

        // trying to validate the sources as they are ordered until one is valid
        (async () => {
            for (const source of sources) {
                if (cancelled) return;
                const isValid = await validateImage(source);
                if (cancelled) return;
                if (isValid) {
                    setValidSrc(source);
                    return;
                }
            }
            if (!cancelled) {
                setValidSrc(fallback);
            }
        })();
        return () => {
            cancelled = true; // operation was cancelled before image validation completed
        };
    }, [src, fallback]);

    return validSrc;
}
