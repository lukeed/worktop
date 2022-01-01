/**
 * Ensure the incoming `Request` can be upgraded to a Websocket connection.
 * @NOTE Returns an error `Response` if the request cannot upgrade.
 */
export function connect(req: Request): Response | void;
