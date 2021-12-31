/// <reference lib="webworker" />

// TODO: cronevent should be inside "cfw" module
import type { Bindings, Context, CronEvent, Initializer } from 'worktop';
import type { Promisable, Strict } from 'worktop/utils';

export type FetchHandler<B extends Bindings = Bindings> = (
	request: Request,
	bindings: Strict<B>,
	context: Required<Module.Context>
) => Promisable<Response>;

export type CronHandler<B extends Bindings = Bindings> = (
	event: Omit<CronEvent, 'waitUntil'>,
	bindings: Strict<B>,
	context: Pick<Module.Context, 'waitUntil'>
) => Promisable<void>;

export namespace Module {
	export interface Worker<B extends Bindings = Bindings> {
		fetch?: FetchHandler<B>;
		scheduled?: CronHandler<B>;
	}

	export interface Context {
		waitUntil(f: any): void;
		passThroughOnException?(): void;
	}
}

/**
 * Tiny helper for easy TypeScript definition inferences
 */
export function define<
	B extends Bindings = Bindings
>(worker: Module.Worker<B>): Module.Worker<B>;

/**
 * Generate a Module Worker definition from a Module `Initializer` function.
 * @example export default mod.start(API.run);
 */
export function start<
	C extends Context = Context,
	B extends Bindings = Bindings,
>(run: Initializer<C>): Module.Worker<B>;
