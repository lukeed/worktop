import * as tsd from 'tsd';
import { reply, Router, ServerResponse, isCachable, toCache } from '..';
import type { Route, FetchHandler, ServerRequest } from '..';

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

// @ts-expect-error
API.find(123, 'asd');
// @ts-expect-error
API.find('GET', 123);
// @ts-expect-error
API.find('GET', /^foo[/]?/);

tsd.expectType<Route>(
	API.find('GET', '/pathname')
);

reply(event => {
	return API.run(event.request);
});

async function foo1(event: FetchEvent) {
	// @ts-expect-error
	await API.run('hello');

	const res1 = await API.run(event.request);
	tsd.expectType<Response>(res1);

	const res2 = API.run(event.request);
	tsd.expectType<Promise<Response>>(res2);
}

// returns void
// @ts-expect-error
reply(API.listen);

addEventListener('fetch', API.listen);

/**
 * WORKTOP/REQUEST
 */

const request: ServerRequest = {
	method: 'GET',
	url: '/foo?bar=123',
	path: '/foo',
	params: {},
	query: new URLSearchParams('?bar=123'),
	search: '?bar=123',
	headers: new Headers,
	body: null
};


/**
 * WORKTOP/CACHE
 */

reply(event => {
	// @ts-expect-error
	toCache(event, 123);
	// @ts-expect-error
	toCache(123, event);
	// @ts-expect-error
	toCache(123);

	tsd.expectType<Response>(
		toCache(event, new Response)
	);

	// ignore me
	return fetch(event.request);
});

// @ts-expect-error
isCachable(123);

tsd.expectType<boolean>(
	isCachable(new Response)
);
