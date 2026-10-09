// Takes the token out of /board/<shortId>#<token> links before anything renders.
const match =
    /^\/board\/[^/]+\/?$/.test(window.location.pathname) &&
    window.location.hash.match(/^#([\w-]{20,64})$/);

export let guestLinkToken = match ? match[1] : null;

if (guestLinkToken) {
    window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
    );
}

// Once the link page is left without signing in.
export function clearGuestLinkToken() {
    guestLinkToken = null;
}
