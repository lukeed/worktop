import * as tsd from 'tsd';
import * as Cache from '../cache';
import { reply, Router, ServerResponse, STATUS_CODES } from '..';
import type { Route, FetchHandler, ServerRequest, IncomingCloudflareProperties } from '..';

declare function addEventListener(type: 'fetch', handler: FetchHandler): void;

/**
 * WORKTOP/RESPONSE
 */

tsd.expectType<FetchHandler>(
	reply(event => {
		tsd.expectType<FetchEvent>(event);
		tsd.expectType<Request>(event.request);
		return fetch(event.request);
	})
);

// @ts-expect-error
new ServerResponse();
// @ts-expect-error
ServerResponse('GET');

const response = new ServerResponse('GET');

tsd.expectType<ServerResponse>(response);

tsd.expectType<Headers>(response.headers);
tsd.expectType<number>(response.statusCode);
tsd.expectType<BodyInit | null>(response.body);
tsd.expectType<boolean>(response.finished);

// @ts-expect-error
response.finished = true;

tsd.expectType<object>(response.getHeaders());
tsd.expectType<string[]>(response.getHeaderNames());
tsd.expectType<boolean>(response.hasHeader('foo'));
tsd.expectType<string | null>(response.getHeader('foo'));
tsd.expectType<void>(response.setHeader('foo', 'bar'));
tsd.expectType<void>(response.removeHeader('foo'));

// @ts-expect-error
tsd.expectType<void>(response.writeHead('foo'));
tsd.expectType<void>(response.writeHead(200, { foo: 'bar'}));
tsd.expectType<void>(response.writeHead(200));

// @ts-expect-error
tsd.expectType<void>(response.end({ foo: 123 }));
tsd.expectType<void>(response.end(new FormData));
tsd.expectType<void>(response.end('123'));
tsd.expectType<void>(response.end(''));

// @ts-expect-error
tsd.expectType<void>(response.send('200'));
tsd.expectType<void>(response.send(200, undefined));
tsd.expectType<void>(response.send(200, null, { foo: 'bar' }));
tsd.expectType<void>(response.send(200, new FormData));
tsd.expectType<void>(response.send(200));

/**
 * WORKTOP/STATUS
 */
tsd.expectType<string>(STATUS_CODES[200]);
tsd.expectType<string>(STATUS_CODES['200']);
STATUS_CODES['404'] = 'Custom Error Message';

/**
 * WORKTOP/ROUTER
 */

// @ts-expect-error
const invalid = Router();

// valid instantiation
const API = new Router();
tsd.expectType<Router>(API);

// @ts-expect-error
API.add(123, 'asd', console.log)
// @ts-expect-error
API.add('GET', 123, console.log);
// @ts-expect-error
API.add('GET', /^foo[/]?/, 123);

tsd.expectType<void>(
	API.add('GET', '/asd', console.log)
);

API.add('POST', '/items', async (req, res) => {
	// Assert `req` & `res` types
	tsd.expectType<ServerRequest>(req);
	tsd.expectType<ServerResponse>(res);

	// Assert `req` properties
	tsd.expectType<string>(req.url);
	tsd.expectType<string>(req.path);
	tsd.expectType<object>(req.params);
	tsd.expectType<string>(req.hostname);
	tsd.expectType<string>(req.method);
	tsd.expectType<URLSearchParams>(req.query);
	tsd.expectType<()=>Promise<unknown>>(req.body);
	tsd.expectType<(f:any)=>void>(req.extend);
	tsd.expectType<Headers>(req.headers);
	tsd.expectType<string>(req.search);

	// Assert `req.body` types
	let output1 = await req.body();
	tsd.expectType<unknown>(output1);

	type Foo = { bar: string };
	let output2 = await req.body<Foo>();
	tsd.expectType<Foo|void>(output2);

	// Assert raw body parsers
	tsd.expectType<any>(await req.body.json());
	tsd.expectType<Foo>(await req.body.json<Foo>());
	tsd.expectType<ArrayBuffer>(await req.body.arrayBuffer());
	tsd.expectType<FormData>(await req.body.formData());
	tsd.expectType<string>(await req.body.text());
	tsd.expectType<Blob>(await req.body.blob());

	// Assert `req.extend` usage
	req.extend(async function () {}());
	req.extend(fetch('/analytics'));
	req.extend(function () {}());

	// Assert `req.cf` properties
	tsd.expectType<IncomingCloudflareProperties>(req.cf);
	tsd.expectType<string>(req.cf.httpProtocol);
	tsd.expectNotType<string>(req.cf.city);
	tsd.expectType<string>(req.cf.asn);
	// @ts-expect-error
	tsd.expectType<string>(req.cf.country);
	tsd.expectType<string|null>(req.cf.country);
	// @ts-expect-error
	tsd.expectError(req.cf.tlsClientAuth.certFingerprintSHA1);
	tsd.expectType<string>(req.cf.tlsClientAuth!.certFingerprintSHA1);
});

// @ts-expect-error
API.find(123, 'asd');
// @ts-expect-error
API.find('GET', 123);
// @ts-expect-error
API.find('GET', /^foo[/]?/);

tsd.expectType<Route>(
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
	tsd.expectType<Response>(res1);

	const res2 = API.run(event);
	tsd.expectType<Promise<Response>>(res2);
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

	tsd.expectType<Response>(
		Cache.save(event, new Response)
	);

	tsd.expectType<Response>(
		Cache.save(event, new Response, '/custom')
	);

	tsd.expectType<Response>(
		Cache.save(event, new Response, new Request('/custom'))
	);

	// @ts-expect-error
	Cache.lookup(event, new Response);

	Cache.lookup(event, '/custom');
	Cache.lookup(event, new Request('/custom'));

	// ignore me
	return fetch(event.request);
});
