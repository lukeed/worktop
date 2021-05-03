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

// @ts-ignore - faking it
globalThis.Request = function (input: RequestInfo, init: RequestInit = {}) {
	var $ = this as any;
	if (typeof input === 'string') $.url = input;
	else Object.assign($, input);
	Object.assign($, init);
}

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

lookup('should treat HEAD as GET', async () => {
	const request = { method: 'HEAD', url: '/foobar' } as any;
	const event = { request } as any;

	let args: any[] = [];
	Storage.match = (...x: any[]) => {
		args = x;
		return new Response('hello');
	}

	let res = await Cache.lookup(event);
	assert.instance(res, Response);
	assert.is.not(res!.body, 'hello');
	assert.is(res!.body, null); // because HEAD

	// NOTE: stringify because of `Request` instance
	assert.is(
		JSON.stringify(args),
		'[{"method":"GET","url":"/foobar"}]'
	);
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

// @ts-ignore - faking it
globalThis.Response = function Response(body: BodyInit, init: ResponseInit = {}) {
	var $ = this as any;
	$.headers = init.headers || new Headers;
	$.statusText = init.statusText || '';
	$.status = init.status || 200;
	$.body = body || null;
	$.clone = () => 'cloned';
}

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
	const request = { method: 'GET' };
	const event: any = { request, waitUntil: () => waited=1 };
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
	let waited=0, res = new Response();
	const request = { method: 'POST' };
	const event: any = { request, waitUntil: () => waited=1 };
	Storage.put = Mock();

	const output = Cache.save(event, res, '/foo/bar');
	assert.ok(output === res);

	assert.equal(
		Storage.put.args(),
		['/foo/bar', 'cloned']
	);

	assert.is(waited, 1);
});

save('should not save Response if not GET method :: POST', () => {
	let waited=0, saved=0;
	const res = new Response();
	const request = { method: 'POST' };
	const event: any = { request, waitUntil: () => waited=1 };
	Storage.put = () => saved=1;

	const output = Cache.save(event, res);
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

	const output = Cache.save(event, res);
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

	const output = Cache.save(event, res);
	assert.ok(output === res);

	assert.is(saved, 0);
	assert.is(waited, 0);
});

save('should mark `private=set-cookie` :: write', () => {
	let waited = 0;
	const res = new Response();
	const request = { method: 'GET' };
	const event: any = { request, waitUntil: () => waited=1 };
	Storage.put = Mock();

	// set "existing" headers
	res.headers.set('set-cookie', 'foo=bar');

	assert.ok(Cache.isCacheable(res));
	const output = Cache.save(event, res);
	assert.is.not(output, res); // res = res.clone()

	assert.equal(
		Storage.put.args(),
		[request, 'cloned']
	);

	assert.is(waited, 1);

	assert.is(
		res.headers.get('cache-control'),
		'private=Set-Cookie'
	);
});

save('should mark `private=set-cookie` :: append', () => {
	let waited = 0;
	const res = new Response();
	const request = { method: 'GET' };
	const event: any = { request, waitUntil: () => waited=1 };
	Storage.put = Mock();

	// set "existing" headers
	res.headers.set('set-cookie', 'foo=bar');
	res.headers.set('cache-control', 'public,max-age=0');

	assert.ok(Cache.isCacheable(res));
	const output = Cache.save(event, res);
	assert.is.not(output, res); // res = res.clone()

	assert.equal(
		Storage.put.args(),
		[request, 'cloned']
	);

	assert.is(waited, 1);

	assert.is(
		res.headers.get('cache-control'),
		'public,max-age=0, private=Set-Cookie'
	);
});

save.run();
