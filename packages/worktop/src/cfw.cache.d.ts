/// <reference lib="webworker" />

import type { Context, Params } from 'worktop';
import type { Strict } from 'worktop/utils';

/**
 * Determine if the Response can be cached.
 */
export function isCacheable(
	response: Response
): boolean;

/**
 * Cache a Response for the given request.
 * @NOTE A `request` string is treated as a `GET` request.
 */
export function save(
	request: Request | string,
	response: Response,
	context: {
		waitUntil(f: any): void;
	}
): Response;

/**
 * Attempt to retrieve a cached Response for the request.
 * @NOTE A `request` string is treated as a `GET` request.
 */
export function lookup(request: Request | string): Promise<Response | void>;

/**
 * Return a `Handler` that will `lookup` incoming requests and `save` outgoing Responses.
 * If a request has a cached Response, it will be returned. Otherwise this method will
 * wait for a `Response` and assign it to the request for next lookup.
 */
export function sync(): <
	C extends Context = Context,
	P extends Params = Params,
>(
	request: Request,
	context: Omit<C, 'params'> & {
		params: Strict<P & C['params']>;
	}
) => Response|void;
