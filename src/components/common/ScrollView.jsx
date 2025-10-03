import * as ScrollArea from "@radix-ui/react-scroll-area";
import { useEffect, useRef } from "react";

/**
 * Only use if a feature is necessary. Default to overflow otherwise.
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

    const handleDrag = () => {
        const handleClick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            window.removeEventListener("click", handleClick, true);
        };
        window.addEventListener("click", handleClick, true);
    }; // prevents clicking on whatever you release the mouse hold on after dragging the scrollbar (seen on Linux)

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
                <ScrollArea.Thumb onMouseDown={handleDrag} className="rx-scroll-thumb" />
            </ScrollArea.Scrollbar>
        </ScrollArea.Root>
    );
}
