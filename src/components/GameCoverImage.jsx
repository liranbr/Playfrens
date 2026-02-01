import { useValidatedImage } from "@/hooks/useValidatedImage.js";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import "./GameCoverImage.css";

export const GameCoverImage = observer(({ src, alt, ...rest }) => {
    const [loaded, setLoaded] = useState(false);
    const gameCover = useValidatedImage(src);
    // <img> unconditionally rendered, because it needs to start loading
    return (
        <>
            <img
                draggable="false"
                alt={alt}
                referrerPolicy="no-referrer"
                src={gameCover}
                hidden={!loaded}
                onLoad={() => setLoaded(true)}
                onError={() => setLoaded(true)}
                {...rest}
            />
            {!loaded && <div className="cover-skeleton" />}
        </>
    );
});
