import { ErrorCode, HttpStatus } from "#shared/http.js";

export class Response {
    static ErrorCode = ErrorCode;
    static HttpStatus = HttpStatus;

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

    /**
     * Standard 401 response for any `!req.isAuthenticated()` check.
     * @param {import('express').Response} res - Express response
     */
    static sendUnauthenticated = (res) => {
        return res
            .status(Response.HttpStatus.UNAUTHORIZED)
            .json({ error: "Not logged in", code: Response.ErrorCode.NOT_AUTHENTICATED });
    };
}
