import { reply, listen } from 'worktop';
import * as modules from 'worktop/modules';
import * as Cache from 'worktop/cache';

import type { Router, CronEvent } from 'worktop';

declare const API: Router;

/**
 * init: plain
 */

// @ts-expect-error
reply(API.onerror);
reply(API.run);

reply(event => {
	return API.run(event);
});

// @ts-expect-error
listen(reply(API.run));
listen(API.run);

/**
 * init: Cache
 */

// @ts-expect-error
Cache.reply(API.onerror);
Cache.reply(API.run);

// @ts-expect-error
Cache.listen(reply(API.run));
Cache.listen(API.run);

/**
 * init: Module Worker
 */

modules.listen(API.run);

/**
 * Event: fetch
 */

// @ts-expect-error
addEventListener('fetch', API.add);
addEventListener('fetch', reply(API.run));
addEventListener('fetch', Cache.reply(API.run));

const reply$1 = reply(API.run);
const reply$2 = Cache.reply(API.run);
addEventListener('fetch', event => {
	const { method } = event.request;
	if (method === 'GET') {
		// non-cache is useless, but wont throw
		reply$1(event, event.request);
		reply$1(event, '/GET/123');
	} else {
		reply$2(event, event.request);
		reply$2(event, `/${method}/123`);
	}
});

/**
 * Event: scheduled
 */

// @ts-expect-error
addEventListener('scheduled', API.find);

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
