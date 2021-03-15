/// <reference lib="webworker" />

import type { ServerRequest, Params } from 'worktop/request';
import type { ServerResponse, FetchHandler } from 'worktop/response';

type Promisable<T> = Promise<T> | T;

declare global {
	function addEventListener(type: 'fetch', handler: FetchHandler): void;
}

export type Route = { params: Params; handler: Handler | false };
export type Handler = (req: ServerRequest, res: ServerResponse) => Promisable<Response|void>;

export declare class Router {
	add(method: string, route: RegExp | string, handler: Handler): void;
	find(method: string, pathname: string): Route;
	run(event: FetchEvent): Promise<Response>;
	listen(event: FetchEvent): void;
	onerror(req: ServerRequest, res: ServerResponse, status?: number, error?: Error): Promisable<Response>;
	prepare?(req: Omit<ServerRequest, 'params'>, res: ServerResponse): Promisable<void>;
}

// TODO?: worktop/status | worktop/errors
export declare var STATUS_CODES: Record<string|number, string>;
