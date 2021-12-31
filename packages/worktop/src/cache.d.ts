/// <reference lib="webworker" />

import type { Context, Initializer } from 'worktop';
import type { Bindings, Module, FetchHandler } from 'worktop/cfw';

export const Cache: Cache;
export function save(req: Request | string, res: Response, context: Module.Context): Response;
export function lookup(request: Request | string): Promise<Response | void>;
export function isCacheable(res: Response): boolean;

/**
 * Attempt to `lookup` the `event.request`, otherwise run the `handler` and attempt to `save` the Response.
 */
export function start<
	C extends Context = Context,
	B extends Bindings = Bindings,
>(run: Initializer<C>): {
	fetch: FetchHandler<B>;
}
