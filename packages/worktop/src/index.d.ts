/// <reference lib="webworker" />

import type { Module } from 'worktop/cfw';
import type { Promisable, Strict, Dict } from 'worktop/utils';

declare global {
	interface Headers {
		append(name: string, value: { toString(): string }): void;
		set(name: string, value: { toString(): string }): void;
	}
}

export type Params = Dict<string>;

/**
 * All valid HTTP methods
 * @see {require('http').METHODS}
 */
export type Method = 'ACL' | 'BIND' | 'CHECKOUT' | 'CONNECT' | 'COPY' | 'DELETE' | 'GET' | 'HEAD' | 'LINK' | 'LOCK' | 'M-SEARCH' | 'MERGE' | 'MKACTIVITY' | 'MKCALENDAR' | 'MKCOL' | 'MOVE' | 'NOTIFY' | 'OPTIONS' | 'PATCH' | 'POST' | 'PRI' | 'PROPFIND' | 'PROPPATCH' | 'PURGE' | 'PUT' | 'REBIND' | 'REPORT' | 'SEARCH' | 'SOURCE' | 'SUBSCRIBE' | 'TRACE' | 'UNBIND' | 'UNLINK' | 'UNLOCK' | 'UNSUBSCRIBE';



// TODO: move to utils?
type Merge<C extends Context, P> = Omit<C, 'params'> & { params: P };

export type Deferral = (res: Response) => Promisable<void>;

export interface Context extends Module.Context {
	url: URL;
	params: Params;
	defer(f: Deferral): void;
}

export type Handler<
	C extends Context = Context,
	P = Params,
> = (
	request: Request,
	context: Merge<C, P>
) => Promisable<Response | void>;

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

export type Initializer<C extends Context> = (
	request: Request,
	context?: Partial<C> & Module.Context
) => Promise<Response>;

export declare class Router<C extends Context = Context> {
	mount(prefix: `/${string}/`, router: Router<C>): void;
	add<T extends RegExp>(method: Method, route: T, handler: Handler<C, Params>): void;
	add<T extends string>(method: Method, route: T, handler: Handler<C, Strict<RouteParams<T>>>): void;
	onerror(req: Request, context: C & { status?: number; error?: Error }): Promisable<Response>;
	prepare?(req: Request, context: Omit<C, 'params'>): Promisable<Response|void>;
	run: Initializer<C>;
}

/**
 * Compose multiple `Handler` functions together, creating a final handler.
 */
export function compose<
	C extends Context = Context,
	P extends Params = Params,
>(...handlers: Handler<C, P>[]): Handler<C, P>;
