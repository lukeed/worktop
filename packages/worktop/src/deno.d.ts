import type { Context, Initializer } from 'worktop';

/**
 * Start a Deno server from an `Initializer` function.
 * @example await deno.start(API.run);
 */
export function start<
 C extends Context = Context,
>(run: Initializer<C>): Promise<void>
