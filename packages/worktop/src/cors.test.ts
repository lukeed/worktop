import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as CORS from './cors';

import type { Context, Deferral } from 'worktop';

const toContext = () => {
	let queue: Deferral[] = [];
	// @ts-ignore
	return {
		run(res: Response) {
			let x: Deferral | void;
			while (x = queue.pop()) x(res);
		},
		defer(f: Deferral) {
			queue.push(f);
		}
	} as Context;
}

function runner(method: string, handler: Function, headers = {}): Response {
	let context = toContext();
	let req = new Request('/', { method, headers });
	let res = handler(req, context) || new Response('OTHER');
	// @ts-ignore
	context.run(res);
	return res;
}

// ---

const config = suite('config');

config('should be an object', () => {
	assert.type(CORS.config, 'object');
});

config('should allow "*" origin by default', () => {
	assert.is(CORS.config.origin, '*');
});

config('should be mutable', () => {
	const original = CORS.config.methods;
	assert.equal(original, ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']);

	CORS.config.methods = ['GET'];
	assert.not.equal(CORS.config.methods, original);
	assert.equal(CORS.config.methods, ['GET']);

	assert.equal(CORS.config.headers, []);
	CORS.config.headers!.push('x-foobarbaz');
	assert.is(CORS.config.headers!.length, 1);

	CORS.config.methods = original; // reset
	CORS.config.headers = []; // reset
});

config.run();

// ---

const headers = suite('headers');

headers('should be a function', () => {
	assert.type(CORS.headers, 'function');
});

headers('defaults :: request', () => {
	let res = new Response;

	assert.equal(
		CORS.headers(res),
		CORS.config // defaults
	);

	let headers = Object.fromEntries(res.headers);

	assert.is(headers['vary'], undefined);
	assert.is(headers['access-control-allow-origin'], '*');
	assert.is(headers['access-control-expose-headers'], undefined);
	assert.is(headers['access-control-allow-credentials'], undefined);
});

headers('defaults :: preflight', () => {
	let res = new Response();
	CORS.headers(res);

	let headers = Object.fromEntries(res.headers);

	assert.is(headers['vary'], undefined);
	assert.is(headers['access-control-allow-origin'], '*');
	assert.is(headers['access-control-expose-headers'], undefined);
	assert.is(headers['access-control-allow-credentials'], undefined);
});

headers('config :: request', () => {
	let res = new Response();

	CORS.headers(res, {
		origin: 'https://foobar.com',
		expose: ['X-My-Custom-Header', 'X-Another-Custom-Header'],
		credentials: true,
		maxage: 123
	});

	let headers = Object.fromEntries(res.headers);

	assert.is(headers['vary'], 'Origin'); // static origin
	assert.is(headers['access-control-allow-origin'], 'https://foobar.com');
	assert.is(headers['access-control-expose-headers'], 'X-My-Custom-Header,X-Another-Custom-Header');
	assert.is(headers['access-control-allow-credentials'], 'true');
});

headers('merge :: request', () => {
	let res = new Response();

	CORS.headers(res, {
		credentials: true,
		maxage: 0
	});

	let headers = Object.fromEntries(res.headers);

	assert.is(headers['vary'], undefined); // "*" default
	assert.is(headers['access-control-allow-origin'], '*');
	assert.is(headers['access-control-expose-headers'], undefined);
	assert.is(headers['access-control-allow-credentials'], 'true');

	// assert.is(headers['access-control-max-age'], undefined); // not preflight
	// assert.is(headers['access-control-allow-headers'], undefined); // not preflight
	// assert.is(headers['access-control-allow-methods'], undefined); // not preflight
});

headers.run();

// ---

const preflight = suite('preflight');

preflight('should be a function', () => {
	assert.type(CORS.preflight, 'function');
});

preflight('defaults :: GET', async () => {
	let handler = CORS.preflight();
	assert.type(handler, 'function');

	let res = runner('GET', handler);
	let headers = Object.fromEntries(res.headers);

	assert.is(headers['vary'], undefined);
	assert.is(headers['access-control-allow-origin'], '*');
	assert.is(headers['access-control-expose-headers'], undefined);
	assert.is(headers['access-control-allow-credentials'], undefined);

	assert.is(headers['access-control-max-age'], undefined); // preflight only
	assert.is(headers['access-control-allow-headers'], undefined); // preflight only
	assert.is(headers['access-control-allow-methods'], undefined); // preflight only

	assert.is(res.status, 200);
	assert.is(await res.text(), 'OTHER');
});

preflight('defaults :: OPTIONS', () => {
	let handler = CORS.preflight();
	let res = runner('OPTIONS', handler);
	let headers = Object.fromEntries(res.headers);

	// no headers config, must expect to be dynamic/varied
	assert.is(headers['vary'], 'Access-Control-Request-Headers');

	assert.is(headers['access-control-allow-origin'], '*');
	assert.is(headers['access-control-expose-headers'], undefined);
	assert.is(headers['access-control-allow-credentials'], undefined);

	assert.is(headers['access-control-max-age'], undefined); // no value
	assert.is(headers['access-control-allow-headers'], undefined); // no value
	assert.is(headers['access-control-allow-methods'], 'GET,HEAD,PUT,PATCH,POST,DELETE'); // default

	assert.is(res.body, null);
	assert.is(res.status, 204);
});

preflight('custom :: maxage :: OPTIONS', () => {
	let handler = CORS.preflight({
		credentials: true,
		maxage: 0,
	});

	let res = runner('OPTIONS', handler);
	let headers = Object.fromEntries(res.headers);

	// no headers config, must expect to be dynamic/varied
	assert.is(headers['vary'], 'Access-Control-Request-Headers');

	assert.is(headers['access-control-allow-origin'], '*');
	assert.is(headers['access-control-expose-headers'], undefined);
	assert.is(headers['access-control-allow-credentials'], 'true');

	assert.is(headers['access-control-max-age'], '0'); // allows 0
	assert.is(headers['access-control-allow-headers'], undefined); // no value
	assert.is(headers['access-control-allow-methods'], 'GET,HEAD,PUT,PATCH,POST,DELETE'); // default

	assert.is(res.body, null);
	assert.is(res.status, 204);
})

preflight('custom :: kitchen sink :: OPTIONS', () => {
	let handler = CORS.preflight({
		origin: 'https://foobar.com',
		expose: ['X-My-Custom-Header', 'X-Another-Custom-Header'],
		headers: ['X-PINGOTHER', 'Content-Type'],
		methods: ['POST', 'PUT', 'DELETE'],
		credentials: true,
		maxage: 123
	});

	let res = runner('OPTIONS', handler);
	let headers = Object.fromEntries(res.headers);

	assert.is(headers['vary'], 'Origin'); // static origin
	assert.is(headers['access-control-allow-origin'], 'https://foobar.com');
	assert.is(headers['access-control-expose-headers'], 'X-My-Custom-Header,X-Another-Custom-Header');
	assert.is(headers['access-control-allow-credentials'], 'true');

	assert.is(headers['access-control-max-age'], '123');
	assert.is(headers['access-control-allow-headers'], 'X-PINGOTHER,Content-Type');
	assert.is(headers['access-control-allow-methods'], 'POST,PUT,DELETE');
});

preflight('custom :: headers :: static', () => {
	let handler = CORS.preflight({
		headers: ['X-PINGOTHER', 'Content-Type']
	});

	let res = runner('OPTIONS', handler);
	let headers = Object.fromEntries(res.headers);

	// had static headers config
	assert.is(headers['vary'], undefined);
	assert.is(headers['access-control-allow-headers'], 'X-PINGOTHER,Content-Type');
});

preflight('custom :: headers :: reflect', () => {
	let handler = CORS.preflight();
	let res = runner('OPTIONS', handler, {
		'Access-Control-Request-Headers': 'Content-Type',
	});

	let headers = Object.fromEntries(res.headers);

	// no static headers config, must expect dynamic value
	assert.is(headers['vary'], 'Access-Control-Request-Headers');
	assert.is(headers['access-control-allow-headers'], 'Content-Type');
});

preflight('custom :: origin :: string', () => {
	let handler = CORS.preflight({
		origin: 'https://foobar.com'
	});

	let res = runner('OPTIONS', handler);
	let headers = Object.fromEntries(res.headers);

	// no static headers config, must expect dynamic value (append)
	assert.is(headers['vary'], 'Origin, Access-Control-Request-Headers');
	assert.is(headers['access-control-allow-origin'], 'https://foobar.com');
	assert.is(headers['access-control-allow-headers'], undefined);
});

preflight('custom :: origin :: false ("*")', () => {
	let handler = CORS.preflight({ origin: false });

	let res = runner('OPTIONS', handler);
	let headers = Object.fromEntries(res.headers);

	// missing static headers config
	assert.is(headers['vary'], 'Access-Control-Request-Headers');
	assert.is(headers['access-control-allow-origin'], '*');
});

preflight('custom :: origin :: true (reflect)', () => {
	let handler = CORS.preflight({ origin: true });

	let res = runner('OPTIONS', handler, {
		'Origin': 'https://hello.com'
	});

	let headers = Object.fromEntries(res.headers);

	// missing static headers config
	assert.is(headers['vary'], 'Origin, Access-Control-Request-Headers');
	assert.is(headers['access-control-allow-origin'], 'https://hello.com');
});

preflight('custom :: origin :: RegExp (pass)', () => {
	let handler = CORS.preflight({ origin: /foobar/ });
	let res = runner('OPTIONS', handler, {
		'Origin': 'https://foobar.com'
	});

	let headers = Object.fromEntries(res.headers);

	// missing static headers config
	assert.is(headers['vary'], 'Origin, Access-Control-Request-Headers');
	assert.is(headers['access-control-allow-origin'], 'https://foobar.com');
});

preflight('custom :: origin :: RegExp (fail)', () => {
	let handler = CORS.preflight({
		origin: /hello/
	});

	let res = runner('OPTIONS', handler, {
		'Origin': 'https://foobar.com'
	});

	let headers = Object.fromEntries(res.headers);

	// missing static headers config
	assert.is(headers['vary'], 'Origin, Access-Control-Request-Headers');
	assert.is(headers['access-control-allow-origin'], 'false');
});

preflight.run();
