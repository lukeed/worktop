/// <reference lib="webworker" />

import type { ServerResponse } from 'worktop/response';
import type { ServerRequest, Params, Method } from 'worktop/request';

type Promisable<T> = Promise<T> | T;

type CronHandler = (event: CronEvent) => void;
export type ResponseHandler = (event: FetchEvent) => Promisable<Response>;
export type FetchHandler = (event: FetchEvent, request?: Request | string) => void;

interface CronEvent {
	type: 'scheduled';
	/**
	 * The CRON trigger
	 * @example "23 59 LW * *"
	 */
	cron: string;
	/**
	 * Milliseconds since UNIX epoch.
	 * @example new Date(evt.scheduledTime)
	 */
	scheduledTime: number;
	/**
	 * Method wrapper for event's action handler.
	 */
	waitUntil(f: Promisable<any>): void;
}

declare global {
	function addEventListener(type: 'fetch', handler: FetchHandler): void;
	function addEventListener(type: 'scheduled', handler: CronHandler): void;

	interface FetchEvent {
		passThroughOnException(): void;
	}
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

export type Handler<P extends Params = Params> = (req: ServerRequest<P>, res: ServerResponse) => Promisable<Response|void>;

export type RouteParams<T extends string> =
	T extends `${infer Prev}/*/${infer Rest}`
		? RouteParams<Prev> & { wild: string } & RouteParams<Rest>
	: T extends `${string}:${infer P}?/${infer Rest}`
		? { [K in P]?: string } & RouteParams<Rest>
	: T extends `${string}:${infer P}/${infer Rest}`
		? { [K in P]: string } & RouteParams<Rest>
	: T extends `${string}:${infer P}?`
		? { [K in P]?: string }
	: T extends `${string}:${infer P}`
		? { [K in P]: string }
	: T extends `${string}*`
		? { wild: string }
	: {};

export declare class Router {
	add<T extends RegExp>(method: Method, route: T, handler: Handler<Params>): void;
	add<T extends string>(method: Method, route: T, handler: Handler<RouteParams<T>>): void;
	run(event: FetchEvent): Promise<Response>;
	onerror(req: ServerRequest, res: ServerResponse, status?: number, error?: Error): Promisable<Response>;
	prepare?(req: Omit<ServerRequest, 'params'>, res: ServerResponse): Promisable<Response|void>;
}

// TODO?: worktop/status | worktop/errors
export declare var STATUS_CODES: Record<string|number, string>;

/**
 * Compose multiple `Handler` functions together, creating a final handler.
 */
export function compose<P extends Params = Params>(...handlers: Handler<P>[]): Handler<P>;
