import type { Context, Initializer } from 'worktop';

// Wrap an `Initializer` and assign as "fetch" listener
export function start<C extends Context = Context>(run: Initializer<C>): void {
	addEventListener('fetch', event => {
		let { request, ...ctx } = event;
		event.respondWith(
			run(request, ctx as any)
		);
	});
}
