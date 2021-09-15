import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as Cache from './cache';

const Storage = (caches as any).default;

const Mock = (x?: any) => {
	let args: any[], f = (...y: any[]) => (args=y,Promise.resolve(x));
	// @ts-ignore
	return f.args = () => args,f;
}

const cache = suite('Cache');

cache('should be a constant', () => {
	assert.ok(Cache.Cache === Storage);
});

cache.run();

// ---

const lookup = suite('lookup');

lookup('should be a function', () => {
	assert.type(Cache.lookup, 'function');
});

lookup('should call `Cache.match` with arguments', async () => {
	Storage.match = Mock();
	await Cache.lookup(123 as any);
	assert.equal(Storage.match.args(), [123]);
});

lookup('should allow custom `request` value :: string', async () => {
	Storage.match = Mock();
	await Cache.lookup('/foo/bar');
	assert.equal(Storage.match.args(), ['/foo/bar']);
});

lookup('should allow custom `request` value :: Request', async () => {
	Storage.match = Mock();
	const request = { foo: 456 } as any;

	await Cache.lookup(request);
	assert.equal(Storage.match.args(), [request]);
});

lookup('should treat HEAD as GET', async () => {
	let args: any[] = [];
	Storage.match = (...x: any[]) => {
		args = x;
		return new Response('hello');
	}

	let request = new Request('/foobar', { method: 'HEAD' });
	let res = await Cache.lookup(request);

	assert.instance(res, Response);
	assert.is.not(res!.body, 'hello');
	assert.is(res!.body, null); // because HEAD

	assert.is(args.length, 1);
	assert.instance(args[0], Request);
	assert.is(args[0].url, '/foobar');
	assert.is(args[0].method, 'GET');
});

lookup.run();

// ---

const isCacheable = suite('isCacheable');

isCacheable('should be a function', () => {
	assert.type(Cache.isCacheable, 'function');
});

isCacheable('status code :: 200', () => {
	const res = new Response();
	assert.is(Cache.isCacheable(res), true);
});

isCacheable('status code :: 206', () => {
	const res = new Response(null, { status: 206 });
	assert.is(Cache.isCacheable(res), false);
});

isCacheable('cache-control :: public', () => {
	const res = new Response();
	res.headers.set('cache-control', 'public,max-age=0');
	assert.is(Cache.isCacheable(res), true);
});

isCacheable('cache-control :: private', () => {
	const res = new Response();
	res.headers.set('cache-control', 'private,max-age=0');
	assert.is(Cache.isCacheable(res), false);
});

isCacheable('cache-control :: no-store', () => {
	const res = new Response();
	res.headers.set('cache-control', 'public,no-store,max-age=0');
	assert.is(Cache.isCacheable(res), false);
});

isCacheable('cache-control :: no-cache', () => {
	const res = new Response();
	res.headers.set('cache-control', 'public,no-cache');
	assert.is(Cache.isCacheable(res), false);
});

isCacheable('vary :: *', () => {
	const res = new Response();
	res.headers.set('vary', '*');
	assert.is(Cache.isCacheable(res), false);
});

isCacheable('vary :: user-agent', () => {
	const res = new Response();
	res.headers.set('vary', 'user-agent');
	assert.is(Cache.isCacheable(res), true);
});

isCacheable('vary :: multiple', () => {
	const res = new Response();
	res.headers.set('vary', 'accept-encoding, accept-language');
	assert.is(Cache.isCacheable(res), true);
});

isCacheable.run();

// ---

const save = suite('save');

save('should be a function', () => {
	assert.type(Cache.save, 'function');
});

save('should call `event.waitUntil` and `Cache.put` when Response is cacheable', () => {
	let waited=0, res = new Response();
	let request = new Request('/', { method: 'GET' });
	Storage.put = Mock();

	let output = Cache.save(request, res, {
		waitUntil() {
			waited = 1;
		}
	});

	// no "set-cookie" -> no reset
	assert.ok(output === res);

	assert.equal(
		Storage.put.args(),
		[request, res]
	);

	assert.is(waited, 1);
});

save('should treat custom `request`-string as GET', () => {
	let waited = 0;
	let res = new Response;
	Storage.put = Mock();

	let output = Cache.save('/foo/bar', res, {
		waitUntil() {
			waited = 1;
		}
	});

	assert.ok(output === res);

	assert.equal(
		Storage.put.args(),
		['/foo/bar', res]
	);

	assert.is(waited, 1);
});

save('should not save Response if not GET method :: POST', () => {
	let waited=0, saved=0;
	const res = new Response();
	const request = { method: 'POST' } as Request;
	const event: any = { request, waitUntil: () => waited=1 };
	Storage.put = () => saved=1;

	const output = Cache.save(request, res, event);
	assert.ok(output === res);

	assert.is(saved, 0);
	assert.is(waited, 0);
});

save('should not save Response if not GET method :: HEAD', () => {
	let waited=0, saved=0;
	const res = new Response();
	const request = { method: 'HEAD' };
	const event: any = { request, waitUntil: () => waited=1 };
	Storage.put = () => saved=1;

	const output = Cache.save(event.request, res, event);
	assert.ok(output === res);

	assert.is(saved, 0);
	assert.is(waited, 0);
});

save('should not save Response if not cacheable', () => {
	let waited=0, saved=0;
	const res = new Response(null, { status: 206 }); // <~ cacheable=false
	const request = { method: 'HEAD' };
	const event: any = { request, waitUntil: () => waited=1 };
	Storage.put = () => saved=1;

	const output = Cache.save(event.request, res, event);
	assert.ok(output === res);

	assert.is(saved, 0);
	assert.is(waited, 0);
});

save('should mark `private=set-cookie` :: write', () => {
	Storage.put = Mock();

	let waited = 0;
	let res = new Response();
	let request = new Request('/', { method: 'GET' });
	let event: any = { request, waitUntil: () => waited=1 };

	// set "existing" headers
	res.headers.set('set-cookie', 'foo=bar');
	assert.ok(Cache.isCacheable(res));

	let copy = Cache.save(event.request, res, event);
	assert.is.not(copy, res); // res = res.clone()

	assert.equal(
		Storage.put.args(),
		[request, res]
	);

	assert.is(waited, 1);

	let cc = copy.headers.get('cache-control');
	assert.is.not(res.headers.get('cache-control'), cc);
	assert.is(cc, 'private=Set-Cookie');
});

save('should mark `private=set-cookie` :: append', () => {
	let waited = 0;
	let res = new Response();
	let request = new Request('/', { method: 'GET' });
	let event: any = { request, waitUntil: () => waited=1 };
	Storage.put = Mock();

	// set "existing" headers
	res.headers.set('set-cookie', 'foo=bar');
	res.headers.set('cache-control', 'public,max-age=0');

	assert.ok(Cache.isCacheable(res));
	let copy = Cache.save(event.request, res, event);
	assert.is.not(copy, res); // res = res.clone()

	assert.equal(
		Storage.put.args(),
		[request, res]
	);

	assert.is(waited, 1);

	let cc = copy.headers.get('cache-control');
	assert.is(cc, 'public,max-age=0, private=Set-Cookie');
	assert.is.not(res.headers.get('cache-control'), cc);
});

save.run();
