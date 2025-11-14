export class Request {
    static HTTP_METHODS = Object.freeze([
        "all",
        "get",
        "post",
        "put",
        "delete",
        "patch",
        "options",
        "head",
    ]);
}

/** @typedef {typeof Request.HTTP_METHODS[number]} HttpMethod */

export {};