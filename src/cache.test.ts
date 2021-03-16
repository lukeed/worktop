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
	const event = { request: 123 };

	await Cache.lookup(event as any);
	assert.equal(Storage.match.args(), [123]);
});

lookup('should allow custom `request` value :: string', async () => {
	Storage.match = Mock();
	const event = { request: 123 };

	await Cache.lookup(event as any, '/foo/bar');
	assert.equal(Storage.match.args(), ['/foo/bar']);
});

lookup('should allow custom `request` value :: Request', async () => {
	Storage.match = Mock();
	const request = { foo: 456 } as any;
	const event = { request: 123 } as any;

	await Cache.lookup(event, request);
	assert.equal(Storage.match.args(), [request]);
});

lookup.run();

// ---

const isCacheable = suite('isCacheable');

// @ts-ignore - faking it
globalThis.Headers = class Headers extends Map {
	get(key: string) {
		return super.get(key.toLowerCase());
	}
	has(key: string) {
		return super.has(key.toLowerCase());
	}
	set(key: string, value: string) {
		return super.set(key.toLowerCase(), value);
	}
	append(key: string, val: string) {
		let prev = this.get(key) || '';
		if (prev) prev += ', ';
		this.set(key, prev + val);
	}
}

const Response = (status = 200): any => ({ status, headers: new Headers });

isCacheable('should be a function', () => {
	assert.type(Cache.isCacheable, 'function');
});

isCacheable('status code :: 200', () => {
	const res = Response(200);
	assert.is(Cache.isCacheable(res), true);
});

isCacheable('status code :: 206', () => {
	const res = Response(206);
	assert.is(Cache.isCacheable(res), false);
});

isCacheable('cache-control :: public', () => {
	const res = Response();
	res.headers.set('cache-control', 'public,max-age=0');
	assert.is(Cache.isCacheable(res), true);
});

isCacheable('cache-control :: private', () => {
	const res = Response();
	res.headers.set('cache-control', 'private,max-age=0');
	assert.is(Cache.isCacheable(res), false);
});

isCacheable('cache-control :: no-store', () => {
	const res = Response();
	res.headers.set('cache-control', 'public,no-store,max-age=0');
	assert.is(Cache.isCacheable(res), false);
});

isCacheable('cache-control :: no-cache', () => {
	const res = Response();
	res.headers.set('cache-control', 'public,no-cache');
	assert.is(Cache.isCacheable(res), false);
});

isCacheable('vary :: *', () => {
	const res = Response();
	res.headers.set('vary', '*');
	assert.is(Cache.isCacheable(res), false);
});

isCacheable('vary :: user-agent', () => {
	const res = Response();
	res.headers.set('vary', 'user-agent');
	assert.is(Cache.isCacheable(res), true);
});

isCacheable('vary :: multiple', () => {
	const res = Response();
	res.headers.set('vary', 'accept-encoding, accept-language');
	assert.is(Cache.isCacheable(res), true);
});

isCacheable('set-cookie :: make cookie private', () => {
	const res = Response();
	res.headers.set('set-cookie', 'foo=bar');
	assert.is(Cache.isCacheable(res), true);

	assert.is(
		res.headers.get('cache-control'),
		'private=Set-Cookie'
	);
});

isCacheable('set-cookie :: append cache-control', () => {
	const res = Response();
	res.headers.set('set-cookie', 'foo=bar');
	res.headers.set('cache-control', 'public,max-age=0');
	assert.is(Cache.isCacheable(res), true);

	assert.is(
		res.headers.get('cache-control'),
		'public,max-age=0, private=Set-Cookie'
	);
});

isCacheable.run();

// ---

const save = suite('save');

save('should be a function', () => {
	assert.type(Cache.save, 'function');
});

save('should call `event.waitUntil` and `Cache.put` when Response is cacheable', () => {
	let waited=0, res = Response();
	const request = { method: 'GET' };
	const event: any = { request, waitUntil: () => waited=1 };
	res.clone = () => 'cloned';
	Storage.put = Mock();

	const output = Cache.save(event, res);
	assert.ok(output === res);

	assert.equal(
		Storage.put.args(),
		[request, 'cloned']
	);

	assert.is(waited, 1);
});

save('should treat custom `request`-string as GET', () => {
	let waited=0, res = Response();
	const request = { method: 'POST' };
	const event: any = { request, waitUntil: () => waited=1 };
	res.clone = () => 'cloned';
	Storage.put = Mock();

	const output = Cache.save(event, res, '/foo/bar');
	assert.ok(output === res);

	assert.equal(
		Storage.put.args(),
		['/foo/bar', 'cloned']
	);

	assert.is(waited, 1);
});

save('should not save Response if not GET|HEAD method', () => {
	let waited=0, saved=0;
	const res = Response();
	const request = { method: 'POST' };
	const event: any = { request, waitUntil: () => waited=1 };
	Storage.put = () => saved=1;
	res.clone = () => 'cloned';

	const output = Cache.save(event, res);
	assert.ok(output === res);

	assert.is(saved, 0);
	assert.is(waited, 0);
});

save('should not save Response if not cacheable', () => {
	let waited=0, saved=0;
	const res = Response(206); // <~ cacheable=false
	const request = { method: 'HEAD' };
	const event: any = { request, waitUntil: () => waited=1 };
	Storage.put = () => saved=1;
	res.clone = () => 'cloned';

	const output = Cache.save(event, res);
	assert.ok(output === res);

	assert.is(saved, 0);
	assert.is(waited, 0);
});

save.run();
