/// <reference lib="webworker" />

import type { FetchHandler } from 'worktop';

export const Cache: Cache;
export function save(event: FetchEvent, res: Response, request?: Request | string): Response;
export function lookup(event: FetchEvent, request?: Request | string): Promise<Response | void>;
export function isCacheable(res: Response): boolean;

export type ResponseHandler = (event: FetchEvent) => Promise<Response>;

/**
 * Attempt to `lookup` the `event.request`, otherwise run the `handler` and attempt to `save` the Response.
 * @param {ResponseHandler} handler
 */
export function reply(handler: ResponseHandler): FetchHandler;

/**
 * Assign the `handler` to the "fetch" event.
 * @note Your `handler` will be wrapped by `reply` automatically.
 * @param {ResponseHandler} handler
 */
export function listen(handler: ResponseHandler): void;
