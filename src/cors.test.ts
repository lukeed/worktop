import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as CORS from './cors';

import type { ServerResponse } from 'worktop/response';
import type { ServerRequest } from 'worktop/request';

const Headers = () => {
	let raw = new Map;
	let set = raw.set.bind(raw);
	// @ts-ignore - mutating
	raw.set = (k, v) => set(k, String(v));
	// @ts-ignore - mutating
	raw.append = (k, v) => {
		let val = raw.get(k) || '';
		if (val) val += ', ';
		val += String(v);
		set(k, val);
	}
	// @ts-ignore - ctor
	return raw as Headers;
}

const Response = () => {
	let headers = Headers();
	let body: any, finished = false;
	// @ts-ignore
	return {
		headers,
		finished,
		statusCode: 0,
		setHeader: headers.set,
		body: () => body,
		end(val: any) {
			finished = true;
			body = val;
		}
	} as ServerResponse;
}

const Request = (method = 'GET'): ServerRequest => {
	let headers = Headers();
	return { method, headers } as ServerRequest;
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
	let res = Response();

	assert.is(
		CORS.headers(res),
		undefined
	);

	let headers = Object.fromEntries(res.headers);

	assert.is(headers['Vary'], undefined);
	assert.is(headers['Access-Control-Allow-Origin'], '*');
	assert.is(headers['Access-Control-Expose-Headers'], undefined);
	assert.is(headers['Access-Control-Allow-Credentials'], undefined);

	assert.is(headers['Access-Control-Max-Age'], undefined); // preflight only
	assert.is(headers['Access-Control-Allow-Headers'], undefined); // preflight only
	assert.is(headers['Access-Control-Allow-Methods'], undefined); // preflight only
});

headers('defaults :: preflight', () => {
	let res = Response();
	CORS.headers(res, undefined, true);

	let headers = Object.fromEntries(res.headers);

	assert.is(headers['Vary'], undefined);
	assert.is(headers['Access-Control-Allow-Origin'], '*');
	assert.is(headers['Access-Control-Expose-Headers'], undefined);
	assert.is(headers['Access-Control-Allow-Credentials'], undefined);

	assert.is(headers['Access-Control-Max-Age'], undefined);
	assert.is(headers['Access-Control-Allow-Headers'], undefined);
	assert.is(headers['Access-Control-Allow-Methods'], 'GET,HEAD,PUT,PATCH,POST,DELETE');
});

headers('config :: request', () => {
	let res = Response();

	CORS.headers(res, {
		origin: 'https://foobar.com',
		expose: ['X-My-Custom-Header', 'X-Another-Custom-Header'],
		credentials: true,
		maxage: 123
	});

	let headers = Object.fromEntries(res.headers);

	assert.is(headers['Vary'], 'Origin'); // static origin
	assert.is(headers['Access-Control-Allow-Origin'], 'https://foobar.com');
	assert.is(headers['Access-Control-Expose-Headers'], 'X-My-Custom-Header,X-Another-Custom-Header');
	assert.is(headers['Access-Control-Allow-Credentials'], 'true');

	assert.is(headers['Access-Control-Max-Age'], undefined); // not preflight
	assert.is(headers['Access-Control-Allow-Headers'], undefined); // not preflight
	assert.is(headers['Access-Control-Allow-Methods'], undefined); // not preflight
});

headers('config :: preflight', () => {
	let res = Response();

	CORS.headers(res, {
		origin: 'https://foobar.com',
		expose: ['X-My-Custom-Header', 'X-Another-Custom-Header'],
		headers: ['X-PINGOTHER', 'Content-Type'],
		methods: ['POST', 'PUT', 'DELETE'],
		credentials: true,
		maxage: 123
	}, true);

	let headers = Object.fromEntries(res.headers);

	assert.is(headers['Vary'], 'Origin'); // static origin
	assert.is(headers['Access-Control-Allow-Origin'], 'https://foobar.com');
	assert.is(headers['Access-Control-Expose-Headers'], 'X-My-Custom-Header,X-Another-Custom-Header');
	assert.is(headers['Access-Control-Allow-Credentials'], 'true');

	assert.is(headers['Access-Control-Max-Age'], '123');
	assert.is(headers['Access-Control-Allow-Headers'], 'X-PINGOTHER,Content-Type');
	assert.is(headers['Access-Control-Allow-Methods'], 'POST,PUT,DELETE');
});

headers('merge :: request', () => {
	let res = Response();

	CORS.headers(res, {
		credentials: true,
		maxage: 0
	});

	let headers = Object.fromEntries(res.headers);

	assert.is(headers['Vary'], undefined); // "*" default
	assert.is(headers['Access-Control-Allow-Origin'], '*');
	assert.is(headers['Access-Control-Expose-Headers'], undefined);
	assert.is(headers['Access-Control-Allow-Credentials'], 'true');

	assert.is(headers['Access-Control-Max-Age'], undefined); // not preflight
	assert.is(headers['Access-Control-Allow-Headers'], undefined); // not preflight
	assert.is(headers['Access-Control-Allow-Methods'], undefined); // not preflight
});

headers('merge :: preflight', () => {
	let res = Response();

	CORS.headers(res, {
		credentials: true,
		maxage: 0
	}, true);

	let headers = Object.fromEntries(res.headers);

	assert.is(headers['Vary'], undefined); // "*" default
	assert.is(headers['Access-Control-Allow-Origin'], '*');
	assert.is(headers['Access-Control-Expose-Headers'], undefined);
	assert.is(headers['Access-Control-Allow-Credentials'], 'true');

	assert.is(headers['Access-Control-Max-Age'], '0'); // allows 0
	assert.is(headers['Access-Control-Allow-Headers'], undefined);
	assert.is(headers['Access-Control-Allow-Methods'], 'GET,HEAD,PUT,PATCH,POST,DELETE'); // default
});

headers.run();

// ---

const preflight = suite('preflight');

preflight('should be a function', () => {
	assert.type(CORS.preflight, 'function');
});

preflight('defaults :: standard', () => {
	let req=Request(), res=Response();
	let handler = CORS.preflight();

	assert.type(handler, 'function');
	let out = handler(req, res);
	assert.is(out, undefined);

	let headers = Object.fromEntries(res.headers);

	assert.is(headers['Vary'], undefined);
	assert.is(headers['Access-Control-Allow-Origin'], '*');
	assert.is(headers['Access-Control-Expose-Headers'], undefined);
	assert.is(headers['Access-Control-Allow-Credentials'], undefined);

	assert.is(headers['Access-Control-Max-Age'], undefined); // preflight only
	assert.is(headers['Access-Control-Allow-Headers'], undefined); // preflight only
	assert.is(headers['Access-Control-Allow-Methods'], undefined); // preflight only

	// @ts-ignore - no response handler
	assert.is(res.body(), undefined);
	assert.is(res.statusCode, 0);
});

preflight('defaults :: preflight', () => {
	let req = Request('OPTIONS');
	let res = Response();

	CORS.preflight()(req, res);

	let headers = Object.fromEntries(res.headers);

	// no headers config, must expect to be dynamic/varied
	assert.is(headers['Vary'], 'Access-Control-Request-Headers');

	assert.is(headers['Access-Control-Allow-Origin'], '*');
	assert.is(headers['Access-Control-Expose-Headers'], undefined);
	assert.is(headers['Access-Control-Allow-Credentials'], undefined);

	assert.is(headers['Access-Control-Max-Age'], undefined); // no value
	assert.is(headers['Access-Control-Allow-Headers'], undefined); // no value
	assert.is(headers['Access-Control-Allow-Methods'], 'GET,HEAD,PUT,PATCH,POST,DELETE'); // default

	// @ts-ignore
	assert.is(res.body(), null);
	assert.is(res.statusCode, 204);
});

preflight('custom :: headers :: static', () => {
	let req = Request('OPTIONS');
	let res = Response();

	CORS.preflight({
		headers: ['X-PINGOTHER', 'Content-Type']
	})(req, res);

	let headers = Object.fromEntries(res.headers);

	// had static headers config
	assert.is(headers['Vary'], undefined);
	assert.is(headers['Access-Control-Allow-Headers'], 'X-PINGOTHER,Content-Type');
});

preflight('custom :: headers :: reflect', () => {
	let req = Request('OPTIONS');
	let res = Response();

	req.headers.set('Access-Control-Request-Headers', 'Content-Type');

	CORS.preflight()(req, res);

	let headers = Object.fromEntries(res.headers);

	// no static headers config, must expect dynamic value
	assert.is(headers['Vary'], 'Access-Control-Request-Headers');
	assert.is(headers['Access-Control-Allow-Headers'], 'Content-Type');
});

preflight('custom :: origin :: string', () => {
	let req = Request('OPTIONS');
	let res = Response();

	CORS.preflight({
		origin: 'https://foobar.com'
	})(req, res);

	let headers = Object.fromEntries(res.headers);
	// no static headers config, must expect dynamic value (append)
	assert.is(headers['Vary'], 'Origin, Access-Control-Request-Headers');
	assert.is(headers['Access-Control-Allow-Origin'], 'https://foobar.com');
	assert.is(headers['Access-Control-Allow-Headers'], undefined);
});

preflight('custom :: origin :: false ("*")', () => {
	let req = Request('OPTIONS');
	let res = Response();

	CORS.preflight({ origin: false })(req, res);

	let headers = Object.fromEntries(res.headers);

	// missing static headers config
	assert.is(headers['Vary'], 'Access-Control-Request-Headers');
	assert.is(headers['Access-Control-Allow-Origin'], '*');
});

preflight('custom :: origin :: true (reflect)', () => {
	let req = Request('OPTIONS');
	let res = Response();

	req.headers.set('Origin', 'https://hello.com');
	CORS.preflight({ origin: true })(req, res);

	let headers = Object.fromEntries(res.headers);

	// missing static headers config
	assert.is(headers['Vary'], 'Origin, Access-Control-Request-Headers');
	assert.is(headers['Access-Control-Allow-Origin'], 'https://hello.com');
});

preflight('custom :: origin :: RegExp (pass)', () => {
	let req = Request('OPTIONS');
	let res = Response();

	req.headers.set('Origin', 'https://foobar.com');
	CORS.preflight({ origin: /foobar/ })(req, res);

	let headers = Object.fromEntries(res.headers);

	// missing static headers config
	assert.is(headers['Vary'], 'Origin, Access-Control-Request-Headers');
	assert.is(headers['Access-Control-Allow-Origin'], 'https://foobar.com');
});

preflight('custom :: origin :: RegExp (fail)', () => {
	let req = Request('OPTIONS');
	let res = Response();

	req.headers.set('Origin', 'https://foobar.com');
	CORS.preflight({ origin: /hello/ })(req, res);

	let headers = Object.fromEntries(res.headers);

	// missing static headers config
	assert.is(headers['Vary'], 'Origin, Access-Control-Request-Headers');
	assert.is(headers['Access-Control-Allow-Origin'], 'false');
});

preflight.run();
