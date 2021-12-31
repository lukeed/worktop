import type { Strict } from 'worktop/utils';
import type { Context, Initializer } from 'worktop';
import type { Module, Bindings } from 'worktop/cfw';

// Tiny helper for TypeScript definition
export function define<B extends Bindings = Bindings>(worker: Module.Worker<B>): Module.Worker<B> {
	return worker;
}

/**
 * Generate a Module Worker definition from a Module `Initializer` function.
 * @example export default cfw.start(API.run)
 */
export function start<
	B extends Bindings = Bindings,
	C extends Context = Context
>(run: Initializer<C>): Module.Worker<B> {
	type BC = C & { bindings: Strict<B> };
	return {
		fetch(req, env, ctx) {
			(ctx as BC).bindings = env;
			return run(req, ctx as BC);
		}
	};
}

/**
 * Attach the `Initializer` function as a "fetch" event listener.
 */
export { start as listen } from 'worktop/sw';
