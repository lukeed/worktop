import * as modules from 'worktop/module';
import * as Cache from 'worktop/cache';
import * as sw from 'worktop/sw';

import type { Module } from 'worktop/module';
import type { Bindings, Context, Router, CronEvent } from 'worktop';
import type { ResponseHandler } from 'worktop/sw';
import type { Strict } from 'worktop/utils';

declare const API: Router;
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
	sw.reply(API.run)
);

assert<void>(
	sw.reply(CUSTOM.run)
);

// @ts-expect-error
sw.listen(API.run);

assert<ResponseHandler>(
	sw.convert(API.run)
);

assert<ResponseHandler>(
	sw.convert(CUSTOM.run)
);

assert<void>(
	sw.listen(
		sw.convert(API.run)
	)
);

/**
 * init: Cache
 */

assert<Module.Worker>(
	Cache.reply(API.run)
);

assert<Module.Worker>(
	Cache.reply(CUSTOM.run)
);

// @ts-expect-error
Cache.listen(API.run);

assert<void>(
	Cache.listen(
		sw.convert(API.run)
	)
);

/**
 * init: Module Worker
 */

modules.reply(API.run);
assert<Module.Worker>(
	modules.reply(API.run)
);

modules.reply(CUSTOM.run);
assert<Module.Worker>(
	modules.reply(CUSTOM.run)
);

modules.reply(CUSTOM.run);
assert<Module.Worker<MyBindings>>(
	modules.reply<MyContext, MyBindings>(CUSTOM.run)
);

// @ts-expect-error
modules.listen(API.run);

assert<Module.Worker>(
	modules.listen(
		sw.convert(API.run)
	)
);

modules.define({
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

modules.define<MyBindings>({
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

// @ts-expect-error
addEventListener('fetch', API.run);
addEventListener('fetch', sw.convert(API.run));
addEventListener('fetch', event => {
	event.respondWith(
		Cache.lookup(event.request).then(prev => {
			return prev || API.run(event.request, event).then(res => {
				return Cache.save(event.request, res, event);
			})
		})
	)
});

const worker1 = modules.reply(API.run);
const worker2 = Cache.reply(API.run);

addEventListener('fetch', event => {
	let req = event.request;
	let bindings: Bindings = {};
	event.respondWith((async function () {
		let res = await worker1.fetch!(req, bindings, event);
		return res || worker2.fetch!(req, bindings, event);
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
