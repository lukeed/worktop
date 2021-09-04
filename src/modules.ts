import type { Bindings, ResponseHandler } from 'worktop';
import type { ModuleWorker } from 'worktop/modules';

// Tiny helper for TypeScript definition
export function define<B extends Bindings = Bindings>(worker: ModuleWorker<B>): ModuleWorker<B> {
	return worker;
}

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
