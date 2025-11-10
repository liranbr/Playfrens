import { useDataStore } from "@/stores/index.js";
import { TourProvider, useTour } from "@reactour/tour";
import { Button } from "@/components";
import "./WelcomeTour.css";

export function WelcomeTour({ children }) {
    const steps = [
        {
            content: (
                <p>
                    <img src="/Playfrens_Logo.png" alt="Playfrens Logo" className="tour-logo" />
                    <b> Playfrens</b> is a tool for managing the games you play with your friends.
                </p>
            ),
            position: "center",
        },
        {
            selector: ".tbg-friend",
            content: "Here you can add friends",
            position: "right",
        },
        {
            highlightedSelectors: [".tbg-category", ".tbg-status"],
            content: (
                <>
                    <p>
                        These are some categories and statuses as an example, but you can set your
                        own.
                    </p>
                    <small>Tip: you can select multiple at once</small>
                </>
            ),
            position: "right", // TODO: Fix positioning at the bottom-right rather than top-right if the sidebar reaches screen bottom
        },
        {
            selector: ".new-game-button",
            content: () => {
                const { setIsOpen } = useTour();
                return (
                    <>
                        <p>Your board is nothing without games! </p>
                        <p>You can add some here.</p>
                        <small>* Importing Steam Library and Friends coming soon</small>
                        <Button
                            className="finish-tour"
                            variant="secondary"
                            onClick={() => setIsOpen(false)}
                        >
                            Finish Tour
                        </Button>
                    </>
                );
            },
            position: "bottom", // TODO: Fix positioning to the top-left instead of bottom, then can remove the marginTop 20 style.
        },
    ];
    const { showTour } = useDataStore();

    return (
        <TourProvider
            styles={{
                popover: (base, { position }) => ({
                    // TODO: maybe positioning can be fixed with the {position} prop?
                    ...base,
                    boxShadow: "0 0 20px rgba(0, 0, 0, 0.9)",
                    backgroundColor: "var(--pf-bg-300)",
                    borderRadius: "16px",
                    border: "var(--pf-border-300)",
                    color: "white",
                    fontSize: "16px",
                    maxWidth: "400px",
                    marginTop: "20px",
                }),
                close: (base) => ({
                    ...base,
                    top: "12px",
                    right: "12px",
                    width: "12px",
                }),
                badge: () => ({
                    display: "none", // the step counter, unnecessary
                }),
                arrow: (base, state) => ({
                    ...base,
                    color: "white",
                    ...(state.disabled && {
                        display: "none",
                    }),
                }),
                maskWrapper: (base) => ({
                    ...base,
                    borderRadius: "16px",
                }),
            }}
            steps={steps}
            scrollSmooth
            defaultOpen={showTour} // this only activates by default once, on the first launch
            disableInteraction // can't interact with the displayed element, to not distract from instructions
            onClickMask={() => {}} // overrides clicking-outside-to-close, user has to intentionally press the X or Finish
            className="app-reactour-popover"
        >
            {children}
        </TourProvider>
    );
}
