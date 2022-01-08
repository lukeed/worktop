import { compose } from 'worktop';
import * as Cache from 'worktop/cache';
import type { Module } from 'worktop/cfw';
import type { Router, Handler } from 'worktop';

declare const event: FetchEvent;
declare const request: Request;
declare const response: Response;
declare const context: Module.Context;
declare const cache: Cache;
declare const API: Router;

/**
 * SAVE
 */

Cache.save(cache, event.request, response, context);
Cache.save(cache, '/foo/bar', response, context);
Cache.save(cache, request, response, context);

// event has `waitUntil` on it
Cache.save(cache, request, response, event);

// @ts-expect-error
Cache.save(cache, event, response, context);

// @ts-expect-error
Cache.save(cache, 123, response, context);

// @ts-expect-error
Cache.save(cache, request, 123, context);

assert<Response>(
	Cache.save(cache, request, response, event)
);

/**
 * SAVE
 */

Cache.lookup(cache, request);
Cache.lookup(cache, '/foo/bar');
Cache.lookup(cache, event.request);

// @ts-expect-error
Cache.lookup(cache, event);

assert<Promise<Response|void>>(
	Cache.lookup(cache, request)
);

assert<Response | void>(
	await Cache.lookup(cache, request)
);

/**
 * isCacheable
 */

Cache.isCacheable(response);

assert<boolean>(
	Cache.isCacheable(response)
);

// @ts-expect-error
Cache.isCacheable(123);

// @ts-expect-error
Cache.isCacheable(request);

/**
 * sync
 */

// @ts-expect-error
Cache.sync();

// @ts-expect-error
Cache.sync(request);

assert<Handler>(
	Cache.sync(cache)
);


/**
 * ROUTER
 */

// @ts-expect-error
API.prepare = Cache.sync;

API.prepare = Cache.sync(cache);

API.prepare = compose(
	Cache.sync(cache),
	async (req, res) => {
		return new Response
	}
);

/**
 * Service Worker
 */

addEventListener('fetch', event => {
	event.respondWith(
		Cache.lookup(cache, event.request).then(prev => {
			return prev || Promise.resolve(response).then(res => {
				return Cache.save(cache, event.request, res, event);
			});
		})
	);
});
