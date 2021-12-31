import type { Context, CronEvent, Initializer } from 'worktop';
import type { Promisable } from 'worktop/utils';

declare global {
	function addEventListener(type: 'fetch', handler: FetchHandler): void;
	function addEventListener(type: 'scheduled', handler: CronHandler): void;

	interface FetchEvent {
		passThroughOnException(): void;
	}
}

export type CronHandler = (event: CronEvent) => Promisable<void>;
export type FetchHandler = (event: FetchEvent) => void;


/**
 * Assign the Module `Initializer` as the "fetch" event listener.
 * @example sw.start(API.run);
 */
export function start<C extends Context = Context>(run: Initializer<C>): void;
