/// <reference lib="webworker" />

import type { ServerResponse } from 'worktop/response';
import type { ServerRequest, Params } from 'worktop/request';

type Promisable<T> = Promise<T> | T;

export type FetchHandler = (event: FetchEvent) => void;
export type ResponseHandler = (event: FetchEvent) => Promisable<Response>;

declare global {
	function addEventListener(type: 'fetch', handler: FetchHandler): void;
}

/**
 * Return the `handler` with an `event.respondWith` wrapper.
 * @param {ResponseHandler} handler
 */
export function reply(handler: ResponseHandler): FetchHandler;

/**
 * Assign the `handler` to the "fetch" event.
 * @note Your `handler` will be wrapped by `reply` automatically.
 * @param {ResponseHandler} handler
 */
export function listen(handler: ResponseHandler): void;

export type Route = { params: Params; handler: Handler | false };
export type Handler = (req: ServerRequest, res: ServerResponse) => Promisable<Response|void>;

export declare class Router {
	add(method: string, route: RegExp | string, handler: Handler): void;
	find(method: string, pathname: string): Route;
	run(event: FetchEvent): Promise<Response>;
	onerror(req: ServerRequest, res: ServerResponse, status?: number, error?: Error): Promisable<Response>;
	prepare?(req: Omit<ServerRequest, 'params'>, res: ServerResponse): Promisable<void>;
}

// TODO?: worktop/status | worktop/errors
export declare var STATUS_CODES: Record<string|number, string>;
