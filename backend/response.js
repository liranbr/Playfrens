export class Response {
    static HttpStatus = Object.freeze({
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
        TOO_MANY_REQUESTS: 429,

        // 5xx: Server Errors
        INTERNAL_SERVER_ERROR: 500,
        NOT_IMPLEMENTED: 501,
        SERVICE_UNAVAILABLE: 503,
    });

    /**
     *  @param {import('express').Response} res - Express rseponse
     *  @param {number} status - HTTP response status code
     *  @param {object} payload - An Object to responsd with
     */
    static send = (res, status, payload = {}) => {
        return res.status(status).json(payload);
    };
    /**
     * @param {import('express').Response} res - Express response
     * @param {number} status - HTTP response status code
     * @param {string} message - Message to send
     */
    static sendMessage = (res, status, message) => {
        return res.status(status).send(message);
    };
}
