import { compose } from 'worktop';
import type { Module } from 'worktop/cfw';
import * as Cache from 'worktop/cfw.cache';
import type { Router, Handler } from 'worktop';

declare const event: FetchEvent;
declare const request: Request;
declare const response: Response;
declare const context: Module.Context;
declare const API: Router;

/**
 * SAVE
 */

Cache.save(event.request, response, context);
Cache.save('/foo/bar', response, context);
Cache.save(request, response, context);

// event has `waitUntil` on it
Cache.save(request, response, event);

// @ts-expect-error
Cache.save(event, response, context);

// @ts-expect-error
Cache.save(123, response, context);

// @ts-expect-error
Cache.save(request, 123, context);

assert<Response>(
	Cache.save(request, response, event)
);

/**
 * SAVE
 */

Cache.lookup(request);
Cache.lookup('/foo/bar');
Cache.lookup(event.request);

// @ts-expect-error
Cache.lookup(event);

assert<Promise<Response|void>>(
	Cache.lookup(request)
);

assert<Response | void>(
	await Cache.lookup(request)
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
Cache.sync({} as Cache);

// @ts-expect-error
Cache.sync(request);

assert<Handler>(
	Cache.sync()
);


/**
 * ROUTER
 */

// @ts-expect-error
API.prepare = Cache.sync;

API.prepare = Cache.sync();

API.prepare = compose(
	Cache.sync(),
	async (req, res) => {
		return new Response
	}
);

/**
 * Service Worker
 */

addEventListener('fetch', event => {
	event.respondWith(
		Cache.lookup(event.request).then(prev => {
			return prev || Promise.resolve(response).then(res => {
				return Cache.save(event.request, res, event);
			});
		})
	);
});
