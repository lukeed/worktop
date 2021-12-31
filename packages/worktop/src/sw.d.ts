import type { Context, Initializer } from 'worktop';

declare global {
	function addEventListener(
		type: 'fetch',
		handler: (event: FetchEvent) => void
	): void;
}

/**
 * Assign the Module `Initializer` as the "fetch" event listener.
 * @example sw.start(API.run);
 */
export function start<C extends Context = Context>(run: Initializer<C>): void;
