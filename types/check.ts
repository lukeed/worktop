import * as Cache from 'worktop/cache';
import * as Base64 from 'worktop/base64';
import { Database, until } from 'worktop/kv';
import { ServerResponse } from 'worktop/response';
import { byteLength, HEX, uid, uuid } from 'worktop/utils';
import { listen, reply, Router, STATUS_CODES } from 'worktop';

import type { KV } from 'worktop/kv';
import type { UID, UUID } from 'worktop/utils';
import type { FetchHandler, Route, RouteParams } from 'worktop';
import type { Params, ServerRequest, IncomingCloudflareProperties } from 'worktop/request';

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
reply(API.onerror);
reply(API.run);

// @ts-expect-error
addEventListener('fetch', API.find);
addEventListener('fetch', reply(API.run));
addEventListener('fetch', Cache.reply(API.run));

// @ts-expect-error
listen(reply(API.run));
listen(API.run);

// @ts-expect-error
Cache.reply(API.onerror);
Cache.reply(API.run);

// @ts-expect-error
Cache.listen(reply(API.run));
Cache.listen(API.run);

/**
 * WORKTOP/ROUTER
 * > PATTERNS & PARAMS
 */

let foo='', bar='', baz='', wild='';

// @ts-expect-error
assert<RouteParams<'/:foo'>>({ /*empty*/ });
assert<RouteParams<'/:foo'>>({ foo });
assert<RouteParams<'/:foo?'>>({ foo });
assert<RouteParams<'/:foo?'>>({ /*empty*/ });
assert<RouteParams<'/foo'>>({ /*empty*/ });

// @ts-expect-error
assert<RouteParams<'/foo/:bar'>>({ /*empty*/ });
assert<RouteParams<'/foo/:bar'>>({ bar });
// @ts-expect-error
assert<RouteParams<'/:foo/:bar'>>({ bar });
assert<RouteParams<'/:foo/:bar'>>({ foo, bar });
// @ts-expect-error
assert<RouteParams<'/:foo?/:bar'>>({ /*empty*/ });
assert<RouteParams<'/:foo?/:bar'>>({ foo, bar });
assert<RouteParams<'/:foo?/:bar'>>({ bar });
assert<RouteParams<'/:foo?/:bar?'>>({ /*empty*/ });

// @ts-expect-error
assert<RouteParams<'/foo/:bar/baz'>>({ /*empty*/ });
assert<RouteParams<'/foo/:bar/baz'>>({ bar });
assert<RouteParams<'/:foo/:bar/baz'>>({ foo, bar});
assert<RouteParams<'/:foo?/:bar/baz'>>({ foo, bar });
assert<RouteParams<'/:foo?/:bar/baz'>>({ bar });
assert<RouteParams<'/:foo?/:bar?/baz'>>({ /*empty*/ });
assert<RouteParams<'/:foo?/:bar?/baz'>>({ foo, bar });
assert<RouteParams<'/:foo?/:bar?/baz'>>({ bar });

// @ts-expect-error
assert<RouteParams<'/foo/baz/:bar'>>({ /*empty*/ });
assert<RouteParams<'/foo/baz/:bar'>>({ bar });
// @ts-expect-error
assert<RouteParams<'/:foo/baz/:bar'>>({ /*empty*/ });
// @ts-expect-error
assert<RouteParams<'/:foo/baz/:bar'>>({ foo });
assert<RouteParams<'/:foo/baz/:bar'>>({ foo, bar });
// @ts-expect-error
assert<RouteParams<'/:foo?/baz/:bar'>>({ /*empty*/ });
assert<RouteParams<'/:foo?/baz/:bar'>>({ foo, bar });
assert<RouteParams<'/:foo?/baz/:bar'>>({ bar });
// @ts-expect-error
assert<RouteParams<'/:foo?/baz/:bar?'>>({ hello: 'x' });
assert<RouteParams<'/:foo?/baz/:bar?'>>({ /*empty*/ });
assert<RouteParams<'/:foo?/baz/:bar?'>>({ foo, bar });
assert<RouteParams<'/:foo?/baz/:bar?'>>({ bar });

// @ts-expect-error
assert<RouteParams<'/*'>>({ bar });
assert<RouteParams<'/*'>>({ wild });
// @ts-expect-error
assert<RouteParams<'/foo/*'>>({ /*empty*/ });
assert<RouteParams<'/foo/*'>>({ wild });
// @ts-expect-error
assert<RouteParams<'/:foo/*'>>({ foo });
assert<RouteParams<'/:foo/*'>>({ foo, wild });
// @ts-expect-error
assert<RouteParams<'/:foo?/*'>>({ /*empty*/ });
assert<RouteParams<'/:foo?/*'>>({ foo, wild });
assert<RouteParams<'/:foo?/*'>>({ wild });
// @ts-expect-error
assert<RouteParams<'/:foo/*/:bar?'>>({ bar, wild});
assert<RouteParams<'/:foo/*/:bar?'>>({ foo, bar, wild});
// @ts-expect-error
assert<RouteParams<'/:foo/*/:bar/:baz?'>>({ foo, bar, baz });
assert<RouteParams<'/:foo/*/:bar/:baz?'>>({ foo, bar, baz, wild });
// @ts-expect-error
assert<RouteParams<'/:foo/*/:bar?/:baz'>>({ foo, baz });
assert<RouteParams<'/:foo/*/:bar?/:baz'>>({ foo, baz, wild });
assert<RouteParams<'/:foo/*/:bar?/:baz'>>({ foo, bar, baz, wild });
// @ts-expect-error
assert<RouteParams<'/:foo?/*/:bar/:baz'>>({ bar, baz });
assert<RouteParams<'/:foo?/*/:bar/:baz'>>({ bar, baz, wild });
assert<RouteParams<'/:foo?/*/:bar/:baz'>>({ foo, bar, baz, wild });

API.add('GET', '/foo', (req) => {
	assert<{}>(req.params);
	// @ts-expect-error
	req.params.anything;
});

API.add('GET', '/foo/:bar', (req) => {
	assert<{ bar: string }>(req.params);
	assert<string>(req.params.bar);
	// @ts-expect-error
	req.params.hello;
});

API.add('GET', '/foo/:bar?/:baz', (req) => {
	assert<{ bar?: string, baz: string }>(req.params);
	assert<string|undefined>(req.params.bar);
	assert<string>(req.params.baz);
	// @ts-expect-error
	assert<string>(req.params.bar);
	// @ts-expect-error
	req.params.hello;
});

API.add('GET', '/foo/:bar?/*/:baz', (req) => {
	assert<{ bar?: string, baz: string, wild: string }>(req.params);
	assert<string|undefined>(req.params.bar);
	assert<string>(req.params.wild);
	assert<string>(req.params.baz);
	// @ts-expect-error
	assert<string>(req.params.bar);
	// @ts-expect-error
	req.params.hello;
});

API.add('GET', /^[/]foobar[/]?/, (req) => {
	assert<{}>(req.params);
	assert<Params>(req.params);
	assert<string>(req.params.anything);
});


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


/**
 * WORKTOP/KV
 */

declare namespace Fixed {
	type String<N extends number> = { 0: string; length: N } & string;
}

interface IUser {
	id: string;
	name: string;
	age: number;
}

interface IApp {
	uid: Fixed.String<11>;
	name: string;
}

interface Models {
	user: IUser;
	app: IApp;
}

interface Identifiers {
	user: IUser['id'];
	app: IApp['uid'];
}

declare const APPS: KV.Namespace;
declare const len11: Fixed.String<11>;
declare function toUID(): Fixed.String<11>;

const DB1 = new Database<Models>(APPS);
const DB2 = new Database<Models, Identifiers>(APPS);

async function storage() {
	// @ts-expect-error - number
	await DB1.get('user', 1235678);

	// @ts-expect-error - not fixed string
	await DB2.get('app', 'asd'); // DB2 is explicit
	await DB2.get('app', len11);
	await DB1.get('app', 'asd'); // DB1 is guessing

	assert<IUser|false>(await DB1.get('user', 'id'));
	assert<IApp|false>(await DB2.get('app', len11));

	let user: IUser = {
		id: 'asd',
		name: 'foobar',
		age: 123
	};

	assert<boolean>(await DB1.put('user', user.id, user, true));
	assert<boolean>(await DB1.put('user', user.id, user));
	assert<boolean>(await DB1.del('user', user.id));

	const lookup = (uid: Fixed.String<11>) => DB2.get('app', uid);
	assert<Fixed.String<11>>(await until(toUID, lookup));
}

/**
 * WORKTOP/UTILS
 */
// @ts-expect-error
HEX.push('hello', 'world');
// @ts-expect-error
HEX[10] = 'cannot do this';
assert<readonly string[]>(HEX);

assert<Function>(uid);
assert<string>(uid(24));
assert<Fixed.String<24>>(uid(24));
assert<UID<24>>(uid(24));
assert<string>(uid());
assert<Fixed.String<11>>(uid());
assert<UID<11>>(uid());

// @ts-expect-error
assert<UID<24>>(uid(32));

assert<Function>(uuid);
assert<string>(uuid());
assert<UUID>(uuid());

// @ts-expect-error
assert<Fixed.String<11>>(uuid());
assert<UID<36>>(uuid());

assert<Function>(byteLength);
assert<number>(byteLength(undefined));
assert<number>(byteLength('hello'));
assert<number>(byteLength(''));
assert<number>(byteLength());

/**
 * WORKTOP/BASE64
 */

assert<string>(Base64.encode('asd'));
assert<string>(Base64.base64url('asd'));
assert<string>(Base64.decode('asd'));

// @ts-expect-error
Base64.encode(12345);

// @ts-expect-error
Base64.encode(new Uint8Array);
