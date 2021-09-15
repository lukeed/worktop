import type { ModuleWorker } from 'worktop/modules';
import type { Bindings, Context, Initializer, Handler } from 'worktop';
import type { ResponseHandler } from 'worktop/sw';
import type { Strict } from 'worktop/utils';

// Tiny helper for TypeScript definition
export function define<B extends Bindings = Bindings>(worker: ModuleWorker<B>): ModuleWorker<B> {
	return worker;
}

// Convert a Service Worker `ResponseHandler` into a Module Worker `Handler` type.
export function convert<C extends Context = Context>(handler: ResponseHandler): Handler<C> {
	return function (request, context) {
		let { waitUntil, passThroughOnException } = context;
		let event = { request, waitUntil: waitUntil.bind(context) } as FetchEvent;
		if (passThroughOnException) event.passThroughOnException = passThroughOnException.bind(context);
		return handler(event);
	};
}

// export default modules.reply(API.run)
// Generate a Module Worker definition from a Module `Initializer` function.
export function reply<
	B extends Bindings = Bindings,
	C extends Context = Context
>(run: Initializer<C>): ModuleWorker<B> {
	type BC = C & { bindings: Strict<B> };
	return {
		fetch(req, env, ctx) {
			(ctx as BC).bindings = env;
			return run(req, ctx as BC);
		}
	};
}

// Generate a Module Worker definition from a Service Worker `ResponseHandler` type.
export function listen<B extends Bindings = Bindings>(handler: ResponseHandler): ModuleWorker<B> {
	return {
		fetch(req, env, ctx) {
			// Not ideal; temporary
			Object.assign(globalThis, env);

			return handler({
				request: req,
				waitUntil: ctx.waitUntil.bind(ctx),
				passThroughOnException: ctx.passThroughOnException.bind(ctx),
			} as FetchEvent);
		}
	} as ModuleWorker<B>;
}
