import { compose } from 'worktop';
import * as r2 from 'worktop/cfw.r2';
import * as Cache from 'worktop/cfw.cache';
import type { Router, Context, Handler } from 'worktop';
import type { R2 } from 'worktop/cfw.r2';

declare const API: Router;
declare const request: Request;
declare const bucket: R2.Bucket;

/**
 * SERVE
 */

// @ts-expect-error
r2.serve(bucket, 'foobar');

r2.serve(bucket, request);
r2.serve(bucket, '/foo/bar');
r2.serve(bucket, '/foobar');

assert<Response>(
	await r2.serve(bucket, request)
);

/**
 * SYNC
 */

// @ts-expect-error
r2.sync(); // missing options

assert<Handler>(
	r2.sync({ bucket })
);

assert<Handler>(
	r2.sync({
		bucket: bucket,
		cache: false,
	})
);

assert<Handler>(
	r2.sync({
		bucket: bucket,
		cache: true,
	})
);

assert<Handler>(
	r2.sync({
		bucket: bucket,
		cache: {
			//
		}
	})
);

assert<Handler>(
	r2.sync({
		bucket: bucket,
		cache: {
			storage() {
				return caches.open('foobar');
			},
			// @ts-expect-error - return non-string
			key(req) {
				assert<Request>(req);
				return 123;
			},
			// @ts-expect-error - return boolean
			lifetime(req) {
				assert<Request>(req);
				return false;
			}
		}
	})
);

assert<Handler>(
	r2.sync({
		bucket: bucket,
		cache: {
			lifetime: 123,
			key: () => 'foobar',
		}
	})
);

API.prepare = compose(
	r2.sync({ bucket }),
	async (req, context) => {
		assert<Request>(req);
		assert<Context>(context);
		return new Response;
	}
);

interface Custom extends Context {
	start: number;
	bindings: {
		BUCKET: R2.Bucket;
	}
}

declare const API2: Router<Custom>;

API2.prepare = compose(
	(req, context) => {
		assert<Custom>(context);
	},
	r2.sync({ bucket }),
	(req, context) => {
		assert<Custom>(context);
	},
);

API2.prepare = compose(
	r2.sync({ bucket }),
	(req, context) => {
		assert<Custom>(context);
	},
);

// testing `r2.sync` in place - Request
API2.add('GET', '/assets/foo/*', (req, context) => {
	let bucket = context.bindings.BUCKET;
	return r2.sync({ bucket })(req, context);
});

// testing `r2.sync` in place - string
API2.add('GET', '/assets/bar/*', (req, context) => {
	let keyer = () => context.params.wild;

	return r2.sync({
		bucket: context.bindings.BUCKET,
		cache: { key: keyer },
	})(req, context);
});

// testing `r2.serve` in place - Request
API2.add('GET', '/assets/baz/*', (req, context) => {
	return r2.serve(context.bindings.BUCKET, req);
});

// testing `r2.serve` in place - string
API2.add('GET', '/assets/bat/*', (req, context) => {
	let bucket = context.bindings.BUCKET;
	return r2.serve(bucket, `/${context.params.wild}`);
});

// testing `r2.serve` w/ Cache API in place
API2.add('GET', '/assets/bat/*', async (req, context) => {
	const bucket = context.bindings.BUCKET;
	const key = `/${context.params.wild}` as const;

	let res = await Cache.lookup(key);
	if (res) return res;

	res = await r2.serve(bucket, key);
	return Cache.save(key, res, context);
});

/**
 * LIST
 */

let list1 = r2.list(bucket, { prefix: 'asd' });
assert<AsyncGenerator>(list1);

for await (let result of list1) {
	assert<boolean>(result.done);
	assert<R2.Object.Metadata[]>(result.objects);
	for (let obj of result.objects) {
		assert<R2.Object.Metadata>(obj);
		assert<string>(obj.key);
		assert<string>(obj.etag);
		assert<Date>(obj.uploaded);
		assert<string>(obj.httpEtag);
		assert<R2.Metadata.HTTP>(obj.httpMetadata);
		assert<R2.Metadata.Custom>(obj.customMetadata);
	}
}

type Foobar = Record<'foo'|'bar', string>;

let list2 = r2.list<Foobar>(bucket, {
	limit: 100,
	cursor: 'foobar',
	include: ['httpMetadata']
});

for await (let result of list2) {
	assert<boolean>(result.done);
	assert<R2.Object.Metadata[]>(result.objects);
	assert<R2.Object.Metadata<Foobar>[]>(result.objects);
	for (let obj of result.objects) {
		assert<R2.Object.Metadata>(obj);
		assert<R2.Object.Metadata<Foobar>>(obj);

		assert<R2.Metadata.Custom>(obj.customMetadata);
		assert<Foobar>(obj.customMetadata);
	}
}

/**
 * PAGINATE
 */

assert<R2.Object.Metadata[]>(
	await r2.paginate(bucket)
);

assert<R2.Object.Metadata[]>(
	await r2.paginate<Foobar>(bucket)
);

assert<R2.Object.Metadata<Foobar>[]>(
	await r2.paginate<Foobar>(bucket)
);

assert<R2.Object.Metadata[]>(
	await r2.paginate(bucket, {
		prefix: 'foobar',
		cursor: 'foobar',
		limit: 100,
		page: 6,
	})
);
