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
 */
export function convert(run: Initializer<Context>): ResponseHandler;

/**
 * Assign the Module `Initializer` as the "fetch" event listener.
 * @NOTE Will `convert()` the `Initializer` automatically.
 */
export function reply(init: Initializer<Context>): void;

/**
 * Assign the `ResponseHandler` as the "fetch" event listener.
 */
export function listen(handler: ResponseHandler): void;
