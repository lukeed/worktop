import type { Context, Initializer } from 'worktop';
import type { ResponseHandler } from 'worktop/sw';

// Convert a Module `Initializer` into a Service Worker `ResponseHandler` type.
export function convert<
	C extends Context = Context
>(run: Initializer<C>): (event: FetchEvent) => Promise<Response> {
	return function (event) {
		let { request, ...ctx } = event;
		return run(request, ctx);
	};
}

// Listen to a `ResponseHandler` -> SW
export function listen(handler: ResponseHandler): void {
	addEventListener('fetch', event => {
		event.respondWith(handler(event));
	});
}

// Wrap an `Initializer` and assign as "fetch" listener
export function reply<C extends Context = Context>(run: Initializer<C>): void {
	let handler = convert(run);
	listen(handler);
}
