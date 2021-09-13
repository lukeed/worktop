/// <reference lib="webworker" />

import type { Bindings, Context } from 'worktop';
import type { ModuleWorker } from 'worktop/modules';
import type { Initializer, ModuleContext } from 'worktop';

export const Cache: Cache;
export function save(req: Request | string, res: Response, context: ModuleContext): Response;
export function lookup(request: Request | string): Promise<Response | void>;
export function isCacheable(res: Response): boolean;

export type ResponseHandler = (event: FetchEvent) => Promise<Response>;

/**
 * Attempt to `lookup` the `event.request`, otherwise run the `handler` and attempt to `save` the Response.
 */
export function reply<
	C extends Context = Context,
	B extends Bindings = Bindings,
>(run: Initializer<C>): ModuleWorker<B>;

/**
 * Assign the `handler` to the "fetch" event.
 * @note Your `handler` will be wrapped by `reply` automatically.
 * @param {ResponseHandler} handler
 */
export function listen(handler: ResponseHandler): void
