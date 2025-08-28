import * as ScrollArea from "@radix-ui/react-scroll-area";
import { useEffect, useRef } from "react";

/**
 * A vertically scrollable view component. Should put a div inside it if styling is needed.
 * @param {{
 *   type?: "auto" | "always" | "scroll" | "hover",
 *   rootClassName?: string,
 *   viewportClassName?: string,
 *   children?: React.ReactNode,
 * }} props
 * @returns {JSX.Element}
 */
export function ScrollView({
    type,
    rootClassName = "",
    viewportClassName = "",
    children,
    ...rest
}) {
    const viewportRef = useRef(null);
    useEffect(() => {
        if (viewportRef.current) viewportRef.current.scrollTop = 0;
    }, []); // On mount or reload, force scroll back to top, only once

    return (
        <ScrollArea.Root
            type={type || "auto"}
            className={`rx-scroll-area ${rootClassName}`}
            {...rest}
        >
            <ScrollArea.Viewport
                ref={viewportRef}
                asChild
                className={`rx-scroll-viewport ${viewportClassName}`}
            >
                {children}
            </ScrollArea.Viewport>
            <ScrollArea.Scrollbar orientation="vertical" className="rx-scrollbar">
                <ScrollArea.Thumb className="rx-scroll-thumb" />
            </ScrollArea.Scrollbar>
        </ScrollArea.Root>
    );
}
