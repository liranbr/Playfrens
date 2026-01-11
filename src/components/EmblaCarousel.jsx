import React, { useEffect, useRef } from "react";
import { PrevButton, NextButton, usePrevNextButtons } from "./EmblaCarouselArrowButtons";
import useEmblaCarousel from "embla-carousel-react";

export const EmblaCarousel = () => {
    // not using props for slides or options here, since only 1 carousel in the project, just writing it here
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

    const homepage_slides = ["1.mp4", "2.mp4", "3.png", "4.png"];
    const delayDuration = 4000;

    const autoplayEnabledRef = useRef(true);
    const autoplayTimeoutRef = useRef(null);
    const clearAutoplayTimeout = () => {
        if (autoplayTimeoutRef.current !== null) {
            clearTimeout(autoplayTimeoutRef.current);
            autoplayTimeoutRef.current = null;
        }
    };

    useEffect(() => {
        if (!emblaApi) return;

        const handleSlideChange = () => {
            const currentSlide = emblaApi.slideNodes()[emblaApi.selectedScrollSnap()];
            const video = currentSlide.querySelector("video");

            // Reset and pause all videos, to prevent any that we switch from, from continuing or 'ending' out of sight
            emblaApi.slideNodes().forEach((slide) => {
                const v = slide.querySelector("video");
                if (v) {
                    v.pause();
                    v.currentTime = 0;
                }
            });
            clearAutoplayTimeout(); // Clear the autoplay timer from the previous slide, if there was one

            if (video) {
                video.play().catch((err) => console.log("Autoplay prevented:", err));
                // no need for a timer, <video> has onEnded to scrollNext
            } else {
                autoplayTimeoutRef.current = setTimeout(handleScrollNext, delayDuration);
            }
        };

        handleSlideChange();
        emblaApi.on("select", handleSlideChange);
        emblaApi.on("pointerDown", () => {
            clearAutoplayTimeout();
            autoplayEnabledRef.current = false;
        }); // if user clicks on the content, it should stay rather than auto-scrolling to the next slide
    }, [emblaApi]);

    const handleScrollNext = () => {
        if (autoplayEnabledRef.current) {
            emblaApi?.scrollNext();
        }
    };

    const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } =
        usePrevNextButtons(emblaApi, () => {
            autoplayEnabledRef.current = true; // if user clicks on a button, even if autoplay was paused before, resume autoplay
        });

    return (
        <section className="embla">
            <div className="embla__viewport" ref={emblaRef}>
                <div className="embla__container">
                    {homepage_slides.map((slide_media) => {
                        const sharedProps = {
                            src: "/public/homepage_slides/" + slide_media,
                            className: "embla__slide__media",
                        };
                        return (
                            <div className="embla__slide" key={slide_media}>
                                {slide_media.includes(".mp4") ? (
                                    <video {...sharedProps} onEnded={handleScrollNext} />
                                ) : (
                                    <img {...sharedProps} alt="Slide showcasing Playfrens" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="embla__controls">
                <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
                <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
            </div>
        </section>
    );
};
