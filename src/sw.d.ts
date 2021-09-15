import type { Context, CronEvent, Initializer } from 'worktop';
import type { Promisable } from 'worktop/utils';

declare global {
	function addEventListener(type: 'fetch', handler: FetchHandler): void;
	function addEventListener(type: 'scheduled', handler: CronHandler): void;

	interface FetchEvent {
		passThroughOnException(): void;
	}
}

export type ResponseHandler = (event: FetchEvent) => Promisable<Response>;

export type FetchHandler = (event: FetchEvent, request?: Request | string) => void;
export type CronHandler = (event: CronEvent) => Promisable<void>;


/**
 * Convert a Module `Initializer` into a Service Worker `ResponseHandler` type.
 * @example let handler = sw.convert(API.run);
 */
export function convert<
	C extends Context = Context
>(run: Initializer<C>): (event: FetchEvent) => Promise<Response>


/**
 * Assign the Module `Initializer` as the "fetch" event listener.
 * @note Will `convert()` the `Initializer` automatically.
 * @example sw.reply(API.run);
 */
export function reply<C extends Context = Context>(run: Initializer<C>): void;


/**
 * Assign the `ResponseHandler` as the "fetch" event listener.
 */
export function listen(handler: ResponseHandler): void;
