/// <reference lib="webworker" />

import type { Handler, Initializer } from 'worktop';
import type { Bindings, Context, CronEvent } from 'worktop';
import type { Promisable, Strict } from 'worktop/utils';
import type { ResponseHandler } from 'worktop/sw';

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
 * Quickly "convert" a ServiceWorker `ResponseHandler` into a `Module.Worker` definition.
 */
export function listen<
	B extends Bindings = Bindings
>(handler: ResponseHandler): Module.Worker<B>;

/**
 * Generate a Module Worker definition from a Module `Initializer` function.
 * @example modules.reply(API.run);
 */
export function reply<
	C extends Context = Context,
	B extends Bindings = Bindings,
>(run: Initializer<C>): Module.Worker<B>;

/**
 * Convert a Service Worker `ResponseHandler` into a Module Worker `Handler` type.
 */
export function convert<
	C extends Context = Context
>(handler: ResponseHandler): Handler<C>;
