import * as Cache from 'worktop/cache';
import * as cfw from 'worktop/cfw';
import * as sw from 'worktop/sw';

import type { Strict } from 'worktop/utils';
import type { Context, Router } from 'worktop';
import type { Bindings, CronEvent, Module } from 'worktop/cfw';

declare const API: Router;
declare const CACHE: Cache;
declare const CUSTOM: Router<MyContext>;

interface MyBindings extends Bindings {
	SECRET: string;
}

interface MyContext extends Context {
	count?: number;
	bindings: MyBindings;
}

/**
 * init: plain
 */

assert<void>(
	sw.start(API.run)
);

assert<void>(
	sw.start(CUSTOM.run)
);

assert<void>(
	cfw.listen(CUSTOM.run)
);

/**
 * init: Module Worker
 */

cfw.start(API.run);
assert<Module.Worker>(
	cfw.start(API.run)
);

cfw.start(CUSTOM.run);
assert<Module.Worker>(
	cfw.start(CUSTOM.run)
);

cfw.start(CUSTOM.run);
assert<Module.Worker<MyBindings>>(
	cfw.start<MyContext, MyBindings>(CUSTOM.run)
);

cfw.define({
	fetch(req, bindings, ctx) {
		assert<Module.Context>(ctx);

		assert<Bindings>(bindings);
		assert<Strict<Bindings>>(bindings);
		return API.run(req, { ...ctx, bindings });
	},
	async scheduled(event, bindings, ctx) {
		assert<Module.Context>(ctx);

		assert<Omit<CronEvent, 'waitUntil'>>(event);
		assert<number>(event.scheduledTime);
		assert<string>(event.cron);

		assert<Bindings>(bindings);
		assert<Strict<Bindings>>(bindings);

		await API.run(
			new Request('/foobar'),
			{ ...ctx, bindings }
		);
	}
});

cfw.define<MyBindings>({
	fetch(req, bindings, ctx) {
		assert<Module.Context>(ctx);

		// base type match
		assert<Bindings>(bindings);
		assert<Strict<Bindings>>(bindings);

		// custom type match
		assert<MyBindings>(bindings);
		assert<Strict<MyBindings>>(bindings);

		// @ts-expect-error
		let foobar = bindings.foobar;
		assert<string>(bindings.SECRET);

		return API.run(req, { ...ctx, bindings });
	}
});

/**
 * Event: fetch
 */

cfw.listen(API.run);

// @ts-expect-error
addEventListener('fetch', API.run);

addEventListener('fetch', event => {
	event.respondWith(
		Cache.lookup(CACHE, event.request).then(prev => {
			return prev || API.run(event.request, event).then(res => {
				return Cache.save(CACHE, event.request, res, event);
			})
		})
	)
});

const worker = cfw.start(API.run);

addEventListener('fetch', event => {
	let req = event.request;
	let bindings: Bindings = {};
	event.respondWith((async function () {
		let res = await worker.fetch(req, bindings, event);
		return res || fetch(req);
	})());
});

/**
 * Event: scheduled
 */

addEventListener('scheduled', event => {
	assert<CronEvent>(event);
	assert<string>(event.type);
	assert<'scheduled'>(event.type);

	assert<string>(event.cron);
	assert<number>(event.scheduledTime);

	event.waitUntil(
		fetch('/foobar')
	);
});
