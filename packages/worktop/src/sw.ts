import type { Context, Initializer } from 'worktop';

// Wrap an `Initializer` and assign as "fetch" listener
export function start<C extends Context = Context>(run: Initializer<C>): void {
	addEventListener('fetch', event => {
		let req = event.request;
		// @ts-ignore read only
		delete event.request;
		event.respondWith(
			run(req, event as any)
		);
	});
}
