// Stable codes clients can match on, instead of parsing error text message such "Not logged in."
export const ErrorCode = Object.freeze({
    NOT_AUTHENTICATED: "NOT_AUTHENTICATED",
    FEATURE_DISABLED: "FEATURE_DISABLED",
    STALE_WRITE: "STALE_WRITE",
});

export const HttpStatus = Object.freeze({
    // 2xx: Success
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,

    // 4xx: Client Errors
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    GONE: 410,
    URI_TOO_LONG: 414,
    TOO_MANY_REQUESTS: 429,

    // 5xx: Server Errors
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    SERVICE_UNAVAILABLE: 503,
});
