import * as Cache from '../cache';
import { reply, Router, ServerResponse, STATUS_CODES } from '..';
import type { Route, FetchHandler, ServerRequest, IncomingCloudflareProperties } from '..';

declare function assert<T>(value: T): void;

/**
 * WORKTOP/RESPONSE
 */

assert<FetchHandler>(
	reply(event => {
		assert<FetchEvent>(event);
		assert<Request>(event.request);
		return fetch(event.request);
	})
);

// @ts-expect-error
new ServerResponse();
// @ts-expect-error
ServerResponse('GET');

const response = new ServerResponse('GET');

assert<ServerResponse>(response);

assert<Headers>(response.headers);
assert<number>(response.statusCode);
assert<BodyInit | null>(response.body);
assert<boolean>(response.finished);

// @ts-expect-error
response.finished = true;

assert<object>(response.getHeaders());
assert<string[]>(response.getHeaderNames());
assert<boolean>(response.hasHeader('foo'));
assert<string | null>(response.getHeader('foo'));
assert<void>(response.setHeader('foo', 'bar'));
assert<void>(response.removeHeader('foo'));

// @ts-expect-error
assert<void>(response.writeHead('foo'));
assert<void>(response.writeHead(200, { foo: 'bar'}));
assert<void>(response.writeHead(200));

// @ts-expect-error
assert<void>(response.end({ foo: 123 }));
assert<void>(response.end(new FormData));
assert<void>(response.end('123'));
assert<void>(response.end(''));

// @ts-expect-error
assert<void>(response.send('200'));
assert<void>(response.send(200, undefined));
assert<void>(response.send(200, null, { foo: 'bar' }));
assert<void>(response.send(200, new FormData));
assert<void>(response.send(200));

/**
 * WORKTOP/STATUS
 */
assert<string>(STATUS_CODES[200]);
assert<string>(STATUS_CODES['200']);
STATUS_CODES['404'] = 'Custom Error Message';

/**
 * WORKTOP/ROUTER
 */

// @ts-expect-error
const invalid = Router();

// valid instantiation
const API = new Router();
assert<Router>(API);

// @ts-expect-error
API.add(123, 'asd', console.log)
// @ts-expect-error
API.add('GET', 123, console.log);
// @ts-expect-error
API.add('GET', /^foo[/]?/, 123);

assert<void>(
	API.add('GET', '/asd', console.log)
);

API.add('POST', '/items', async (req, res) => {
	// Assert `req` & `res` types
	assert<ServerRequest>(req);
	assert<ServerResponse>(res);

	// Assert `req` properties
	assert<string>(req.url);
	assert<string>(req.path);
	assert<object>(req.params);
	assert<string>(req.hostname);
	assert<string>(req.method);
	assert<URLSearchParams>(req.query);
	assert<()=>Promise<unknown>>(req.body);
	assert<(f:any)=>void>(req.extend);
	assert<Headers>(req.headers);
	assert<string>(req.search);

	// Assert `req.body` types
	let output1 = await req.body();
	assert<unknown>(output1);

	type Foo = { bar: string };
	let output2 = await req.body<Foo>();
	assert<Foo|void>(output2);

	// Assert raw body parsers
	assert<any>(await req.body.json());
	assert<Foo>(await req.body.json<Foo>());
	assert<ArrayBuffer>(await req.body.arrayBuffer());
	assert<FormData>(await req.body.formData());
	assert<string>(await req.body.text());
	assert<Blob>(await req.body.blob());

	// Assert `req.extend` usage
	req.extend(async function () {}());
	req.extend(fetch('/analytics'));
	req.extend(function () {}());

	// Assert `req.cf` properties
	assert<IncomingCloudflareProperties>(req.cf);
	assert<string>(req.cf.httpProtocol);
	assert<string>(req.cf.asn);

	// @ts-expect-error -> string | undefined
	assert<string>(req.cf.city);
	assert<string|undefined>(req.cf.city);

	// @ts-expect-error
	assert<string>(req.cf.country);
	assert<string|null>(req.cf.country);

	// @ts-expect-error
	tsd.expectError(req.cf.tlsClientAuth.certFingerprintSHA1);
	assert<string>(req.cf.tlsClientAuth!.certFingerprintSHA1);
});

// @ts-expect-error
API.find(123, 'asd');
// @ts-expect-error
API.find('GET', 123);
// @ts-expect-error
API.find('GET', /^foo[/]?/);

assert<Route>(
	API.find('GET', '/pathname')
);

reply(API.run);

reply(event => {
	return API.run(event);
});

async function foo1(event: FetchEvent) {
	// @ts-expect-error
	await API.run('hello');

	const res1 = await API.run(event);
	assert<Response>(res1);

	const res2 = API.run(event);
	assert<Promise<Response>>(res2);
}

// @ts-expect-error
reply(API.listen);

addEventListener('fetch', API.listen);


/**
 * WORKTOP/CACHE
 */

reply(event => {
	// @ts-expect-error
	Cache.save(event, 123);
	// @ts-expect-error
	Cache.save(123, event);
	// @ts-expect-error
	Cache.save(123);

	assert<Response>(
		Cache.save(event, new Response)
	);

	assert<Response>(
		Cache.save(event, new Response, '/custom')
	);

	assert<Response>(
		Cache.save(event, new Response, new Request('/custom'))
	);

	// @ts-expect-error
	Cache.lookup(event, new Response);

	Cache.lookup(event, '/custom');
	Cache.lookup(event, new Request('/custom'));

	// ignore me
	return fetch(event.request);
});
