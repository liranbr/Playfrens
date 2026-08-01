import { useEffect } from "react";

const SITE_URL = "https://playfrens.com";
const DEFAULT_TITLE = "Playfrens";
const DEFAULT_DESCRIPTION =
    "So what are we playing? Playfrens helps you find and plan what to play with friends.";

function setMetaContent(selector, attribute, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute(attribute, value);
}

/** Updates the document's title and meta tags per page. */
export function usePageMeta({
    title,
    description = DEFAULT_DESCRIPTION,
    path,
    noindex = false,
} = {}) {
    useEffect(() => {
        const fullTitle = title ? `${title} - ${DEFAULT_TITLE}` : DEFAULT_TITLE;

        document.title = fullTitle;
        setMetaContent('meta[name="description"]', "content", description);
        setMetaContent('meta[property="og:title"]', "content", fullTitle);
        setMetaContent('meta[property="og:description"]', "content", description);
        setMetaContent('meta[name="twitter:title"]', "content", fullTitle);
        setMetaContent('meta[name="twitter:description"]', "content", description);

        if (path !== undefined) {
            const url = `${SITE_URL}${path}`;
            setMetaContent('meta[property="og:url"]', "content", url);
            setMetaContent('link[rel="canonical"]', "href", url);
        }

        let robotsTag = document.querySelector('meta[name="robots"]');
        if (noindex) {
            if (!robotsTag) {
                robotsTag = document.createElement("meta");
                robotsTag.name = "robots";
                document.head.appendChild(robotsTag);
            }
            robotsTag.setAttribute("content", "noindex");
        } else if (robotsTag) {
            robotsTag.remove();
        }
    }, [title, description, path, noindex]);
}

