import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { Contact, Home, Login, Privacy, Playfrens } from "@/pages";
import "./App.css";

function useScrollbarMeasure() {
    // This measures the width of the user's scrollbar, which varies between OSs and browsers.
    // It then sets this px value as a global CSS variable, used wherever a scrollbar is expected with centered content.
    useEffect(() => {
        function measureScrollbar() {
            const outer = document.createElement("div");
            outer.style.visibility = "hidden";
            outer.style.overflow = "scroll";
            outer.style.position = "absolute";
            outer.style.top = "-9999px";
            document.body.appendChild(outer);
            const inner = document.createElement("div");
            outer.appendChild(inner);

            let width = outer.offsetWidth - inner.offsetWidth;
            if (width > 11) width = 8; // means 'thin scrollbar' CSS hasn't fully loaded when measuring. Let's guess instead of causing shifting through rerenders.
            outer.remove();
            document.documentElement.style.setProperty("--scrollbar-width", `${width}px`);
        }

        measureScrollbar();
        // Measure initially, and re-measure on zoom change. Mounted on the root App().
        let lastRatio = window.devicePixelRatio;
        window.addEventListener("resize", () => {
            if (window.devicePixelRatio !== lastRatio) {
                lastRatio = window.devicePixelRatio;
                measureScrollbar();
            }
        });
    }, []);
}

export default function App() {
    useScrollbarMeasure();

    return (
        <TooltipProvider delayDuration={750}>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/app" element={<Playfrens />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy" element={<Privacy />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    );
}
