import * as SW from 'worktop/sw';
import * as CORS from 'worktop/cors';
import * as Cache from 'worktop/cache';
import * as Base64 from 'worktop/base64';
import { Router, compose, Initializer } from 'worktop';
import { Database, list, paginate, until } from 'worktop/kv';
import { ServerResponse, STATUS_CODES } from 'worktop/response';
import { byteLength, HEX, uid, uuid, ulid, randomize } from 'worktop/utils';
import { timingSafeEqual } from 'worktop/crypto';
import * as modules from 'worktop/modules';
import * as ws from 'worktop/ws';

import type { KV } from 'worktop/kv';
import type { WebSocket } from 'worktop/ws';
import type { UID, UUID, ULID } from 'worktop/utils';
import type { Bindings, Context, CronEvent } from 'worktop';
import type { Params, RouteParams, IncomingCloudflareProperties } from 'worktop';
import type { ModuleWorker } from 'worktop/modules';

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

// NOTE: native cast to string
response.setHeader('foo', 123);
response.setHeader('foo', [123]);
response.setHeader('foo', ['bar']);
response.setHeader('foo', 123.45678);
response.setHeader('foo', ['a', 1, 'b']);

// @ts-expect-error
response.setHeader('foo', { foo: 123 });
// @ts-expect-error - altho technically ok
response.setHeader('foo', new Date);

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

API.add('POST', '/items', async (req, context) => {
	assert<Request>(req);
	assert<string>(req.url);
	assert<string>(req.method);
	assert<Headers>(req.headers);
	assert<ReadableStream|null>(req.body);

	// @ts-expect-error
	await req.body.json();

	assert<Context>(context);
	assert<URL>(context.url);
	assert<string>(context.url.origin);
	assert<string>(context.url.pathname);
	assert<string>(context.url.search);
	assert<URLSearchParams>(context.url.searchParams);
	// TODO? alias :: context.url.query

	// Assert `req.body` types
	let output1 = await req.body();
	// assert<unknown>(output1);

	// type Foo = { bar: string };
	// let output2 = await req.body<Foo>();
	// assert<Foo|void>(output2);

	// // Assert raw body parsers
	// assert<any>(await req.body.json());
	// assert<Foo>(await req.body.json<Foo>());
	// assert<ArrayBuffer>(await req.body.arrayBuffer());
	// assert<FormData>(await req.body.formData());
	// assert<string>(await req.body.text());
	// assert<Blob>(await req.body.blob());

	// Assert `req.extend` usage
	context.waitUntil(async function () {}());
	context.waitUntil(fetch('/analytics'));
	context.waitUntil(function () {}());

	// Assert `req.cf` properties
	assert<IncomingCloudflareProperties>(req.cf);
	assert<string>(req.cf.httpProtocol);
	assert<string>(req.cf.asn);

	assert<string|undefined>(req.cf.city);
	// @ts-expect-error -> string | undefined
	assert<string>(req.cf.city);

	// @ts-expect-error
	assert<string>(req.cf.country);
	assert<string|null>(req.cf.country);

	// @ts-expect-error
	req.cf.tlsClientAuth.certFingerprintSHA1;
	assert<string>(req.cf.tlsClientAuth!.certFingerprintSHA1);
});

reply(API.run);

declare let rhandler: SW.ResponseHandler;
declare let minit: Initializer<Context>;

SW.reply(minit);

async function foo1(event: FetchEvent) {
	// @ts-expect-error
	await rhandler('hello');

	const res1 = await rhandler(event);
	assert<Response>(res1);

	const res2 = rhandler(event);
	assert<Promise<Response> | Response>(res2);
}

// @ts-expect-error
SW.reply(API.onerror);

Cache.reply(API.run);

// @ts-expect-error
addEventListener('fetch', API.add);

const reply$1 = reply(API.run);
const reply$2 = Cache.reply(API.run);

addEventListener('fetch', event => {
	const { method } = event.request;
	if (method === 'GET') {
		// non-cache is useless, but wont throw
		reply$1(event, event.request);
		reply$1(event, '/GET/123');
	} else {
		reply$2(event, event.request);
		reply$2(event, `/${method}/123`);
	}
});

// @ts-expect-error
addEventListener('scheduled', API.find);
addEventListener('scheduled', event => {
	assert<CronEvent>(event);
	assert<string>(event.type);
	assert<'scheduled'>(event.type);

	assert<string>(event.cron);
	assert<number>(event.scheduledTime);

	event.waitUntil(
		fetch('/foobar')
	);
});

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

API.add('GET', '/foo', (req, context) => {
	assert<{}>(context.params);
	// @ts-expect-error
	context.params.anything;
});

API.add('GET', '/foo/:bar', (req, context) => {
	assert<{ bar: string }>(context.params);
	assert<string>(context.params.bar);
	// @ts-expect-error
	context.params.hello;
});

API.add('GET', '/foo/:bar?/:baz', (req, context) => {
	assert<{ bar?: string, baz: string }>(context.params);
	assert<string|undefined>(context.params.bar);
	assert<string>(context.params.baz);
	// @ts-expect-error
	assert<string>(context.params.bar);
	// @ts-expect-error
	context.params.hello;
});

API.add('GET', '/foo/:bar?/*/:baz', (req, context) => {
	assert<{ bar?: string, baz: string, wild: string }>(context.params);
	assert<string|undefined>(context.params.bar);
	assert<string>(context.params.wild);
	assert<string>(context.params.baz);
	// @ts-expect-error
	assert<string>(context.params.bar);
	// @ts-expect-error
	context.params.hello;
});

API.add('GET', /^[/]foobar[/]?/, (req, context) => {
	assert<{}>(context.params);
	assert<Params>(context.params);
	assert<string>(context.params.anything); // TODO :: revert?
});

/**
 * WORKTOP/ROUTER
 * > COMPOSE
 */

API.add('GET', '/foo/:bar?', compose(
	(req, context) => {
		assert<string|void>(context.params.bar);
	},
	async (req, context) => {
		assert<string|void>(context.params.bar);
		return new Response;
	},
	// @ts-expect-error
	(req, context) => {
		assert<string|void>(context.params.bar);
		return 123;
	}
));

// Can be a Handler
API.prepare = compose(
	(req, ctx) => {},
	(req, ctx) => {},
	(req, ctx) => {},
);

// Can be a Handler
API.prepare = function (req, context) {
	// @ts-expect-error
	context.params; // does not exist
	// can now return Response instance~!
	return new Response(null, { status: 204 });
}

// @ts-expect-error - numerical
API.prepare = (req, res) => 123;

API.add('GET', '/static/:group/*', compose(
  CORS.preflight({ maxage: 86400 }),
  async (req, context) => {
		// @ts-expect-error
		context.params.foobar // is not defined
		assert<{ group: string; wild: string }>(context.params);
		assert<string>(context.params.group);
		assert<string>(context.params.wild);
  }
));

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

	// @ts-expect-error
	Cache.save(new Request('/'), new Response);

	assert<Response>(
		Cache.save(new Request('/'), new Response, {
			waitUntil() {
				//
			}
		})
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
	// @ts-expect-error -> string
	await APPS.get<number>('key');
	// @ts-expect-error -> ArrayBuffer
	await APPS.get<number>('key', 'arrayBuffer');
	// @ts-expect-error -> ReadableStream
	await APPS.get<number>('key', 'stream');
	// @ts-expect-error -> string
	await APPS.get<number>('key', 'text');

	assert<string|null>(await APPS.get('key'));
	assert<string|null>(await APPS.get('key', 'text'));
	assert<ArrayBuffer|null>(await APPS.get('key', 'arrayBuffer'));
	assert<number|null>(await APPS.get<number>('key', 'json'));
	assert<IUser|null>(await APPS.get<IUser>('key', 'json'));
	assert<unknown|null>(await APPS.get('key', 'json'));

	// @ts-expect-error - number
	await DB1.get('user', 1235678);

	// @ts-expect-error - not fixed string
	await DB2.get('app', 'asd'); // DB2 is explicit
	await DB2.get('app', len11);
	await DB1.get('app', 'asd'); // DB1 is guessing

	assert<IUser|null>(await DB1.get('user', 'id'));
	assert<IApp|null>(await DB2.get('app', len11));

	assert<IUser|null>(await DB1.get('user', 'id', 'json'));
	assert<IUser|null>(await DB1.get('user', 'id', { type: 'json' }));
	assert<IUser|null>(await DB1.get('user', 'id', { type: 'json', metadata: false }));

	// @ts-expect-error - should not be metadata
	assert<KV.GetMetadata<IUser>>(await DB1.get('user', 'id', { type: 'json', metadata: false }));
	assert<KV.GetMetadata<IUser>>(await DB1.get('user', 'id', { type: 'json', metadata: true }));

	// @ts-expect-error - return type mismatch
	assert<IUser|null>(await DB1.get('user', 'id', { metadata: true }));

	// @ts-expect-error - missing `type` option
	assert<KV.GetMetadata<IUser>>(await DB1.get('user', 'id', { metadata: true }));

	let user123 = await DB1.get('user', 'id', { type: 'json', metadata: true });
	assert<KV.GetMetadata<IUser>>(user123);
	assert<KV.Metadata|null>(user123.metadata);
	assert<IUser|null>(user123.value);

	// allows `Metadata` override, since `DB.get` cannot take type arg
	let metadata = user123.metadata as Record<'foo'|'bar', number>;

	let user: IUser = {
		id: 'asd',
		name: 'foobar',
		age: 123
	};

	assert<boolean>(await DB1.put('user', user.id, user, { toJSON: false }));
	assert<boolean>(await DB1.put('user', user.id, user, { toJSON: true }));
	assert<boolean>(await DB1.put('user', user.id, user));
	assert<boolean>(await DB1.del('user', user.id));

	await DB1.put('user', user.id, user, {
		toJSON: false,
		expiration: 123,
		metadata: { foo: 123 }
	});

	const lookup = (uid: Fixed.String<11>) => DB2.get('app', uid);
	assert<Fixed.String<11>>(await until(toUID, lookup));

	let lister = list(APPS, { prefix: 'asd' });
	assert<AsyncGenerator>(lister);

	for await (let result of lister) {
		assert<boolean>(result.done);
		assert<string[]>(result.keys);
	}

	for await (let result of list(APPS, { metadata: true })) {
		assert<boolean>(result.done);
		assert<KV.KeyInfo[]>(result.keys);

		assert<string>(result.keys[0].name);
		assert<number|undefined>(result.keys[0].expiration);
		assert<KV.Metadata|undefined>(result.keys[0].metadata);
	}

	for await (let result of list<IUser>(APPS, { metadata: true })) {
		assert<boolean>(result.done);
		assert<KV.KeyInfo<IUser>[]>(result.keys);

		assert<string>(result.keys[0].name);
		assert<number|undefined>(result.keys[0].expiration);
		assert<KV.Metadata|undefined>(result.keys[0].metadata);
		assert<IUser|undefined>(result.keys[0].metadata);
	}

	assert<string[]>(await paginate(APPS, { prefix: 'apps::123' }));
	assert<string[]>(await paginate(APPS, { prefix: 'apps::123', metadata: false }));
	assert<KV.KeyInfo[]>(await paginate(APPS, { prefix: 'apps::123', metadata: true }));

	let keys = await paginate(APPS, { page: 2, limit: 12, prefix: 'hello' });
	assert<string>(keys[0]);
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

assert<Function>(ulid);
assert<string>(ulid());
assert<ULID>(ulid());

// @ts-expect-error
assert<Fixed.String<11>>(ulid());
assert<UID<26>>(ulid());

assert<Function>(byteLength);
assert<number>(byteLength(undefined));
assert<number>(byteLength('hello'));
assert<number>(byteLength(''));
assert<number>(byteLength());

assert<Function>(randomize);
assert<Uint8Array>(randomize(11));
// @ts-expect-error
assert<Uint8Array>(randomize());
// @ts-expect-error
assert<Uint32Array>(randomize(1));

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

/**
 * WORKTOP/CORS
 */
assert<CORS.Config>(CORS.config);
assert<string>(CORS.config.origin);
assert<string[]>(CORS.config.headers!);
assert<boolean>(CORS.config.credentials!);
assert<string[]>(CORS.config.methods!);
assert<string[]>(CORS.config.expose!);

assert<Function>(CORS.headers);
assert<Function>(CORS.preflight);

declare var request: Request;

// @ts-expect-error
CORS.headers(request);
CORS.headers(response);

CORS.headers(response, {
	// @ts-expect-error
	origin: true
});

// @ts-expect-error
CORS.preflight(request, response);
CORS.preflight()(request, response);
CORS.preflight({ origin: true });


/**
 * WORKTOP/CRYPTO
 */

declare let i8: Int8Array;
declare let u8: Uint8Array;
declare let u32: Uint32Array;
declare let ab: ArrayBuffer;
declare let dv: DataView;

assert<Function>(timingSafeEqual);
assert<boolean>(timingSafeEqual(u8, u8));

timingSafeEqual(u32, u32);
// @ts-expect-error - DataView
timingSafeEqual(u8, dv);
// @ts-expect-error - ArrayBuffer
timingSafeEqual(ab, i8);
// @ts-expect-error - Mismatch
timingSafeEqual(u8, u32);

/**
 * WORKTOP/WS
 */

const onEvent1: ws.SocketHandler = async function (req, socket) {
	assert<ws.Socket>(socket);
	assert<ServerRequest<Params>>(req);
	assert<ServerRequest>(req);

	let { context, event } = socket;
	assert<Event>(event);
	assert<ws.Context>(context);
	assert<'open'|'close'|'message'|'error'>(event.type);

	if (event.type === 'message') {
		assert<string>(event.data);
	} else {
		// @ts-expect-error
		event.data;
	}
}

type CustomParams = { game?: string };
type CustomContext = { score?: number };
const onEvent2: ws.SocketHandler<CustomParams, CustomContext> = function (req, socket) {
	let { event, context } = socket;

	if (event.type !== 'message') {
		return;
	}

	let { game } = req.params;
	let data = JSON.parse(event.data);
	context.score = context.score || 0;

	switch (data.type) {
		case '+1':
		case 'incr': {
			return socket.send(`${game} score: ${++context.score}`);
		}
		case '-1':
		case 'decr': {
			return socket.send(`${game} score: ${--context.score}`);
		}
	}
}

API.add('GET', '/score/:game', ws.listen(onEvent2));
API.add('GET', /^[/]foobar[/]/, compose(
	(req, res) => {},
	ws.listen(onEvent1)
));

/**
 * WORKTOP/WS
 */

declare let websocket1: WebSocket;
declare let listener1: EventListener;

// @ts-expect-error - "open" not allowed
websocket1.addEventListener('open', listener1);
websocket1.addEventListener('close', listener1);
websocket1.addEventListener('error', listener1);
websocket1.addEventListener('message', evt => {
	assert<MessageEvent>(evt);
	assert<string>(evt.data);
});

/**
 * WORKTOP/MODULES
 */

const worker1: ModuleWorker = {
	async fetch(req, env, ctx) {
		assert<Request>(req);
		assert<IncomingCloudflareProperties>(req.cf);

		assert<Bindings>(env);

		// @ts-expect-error
		let foobar = env.foobar;

		assert<Function>(ctx.waitUntil);
		assert<Function>(ctx.passThroughOnException);

		return new Response;
	},
	async scheduled(event, env, ctx) {
		// @ts-expect-error
		assert<CronEvent>(event);
		assert<string>(event.cron);
		assert<number>(event.scheduledTime);
		// @ts-expect-error
		assert<undefined>(event.waitUntil);
		assert<Function>(ctx.waitUntil);

		assert<Bindings>(env);
	}
};

interface CustomBindings extends Bindings {
	DATAB: KV.Namespace;
	SECRET: string;
	// @ts-expect-error
	COUNT: number;
}

const worker2: ModuleWorker<CustomBindings> = {
	fetch(req, env, ctx) {
		// @ts-expect-error
		assert<Bindings>(env);
		// @ts-expect-error
		assert<CustomBindings>(env);

		assert<string>(env.SECRET);
		assert<KV.Namespace>(env.DATAB);
		assert<number>(env.COUNT);

		// @ts-expect-error
		let foo = env.missing;

		// @ts-expect-error
		assert<undefined>(env.missing);

		return new Response;
	}
}

const worker3 = modules.define<CustomBindings>({
	fetch(req, env, ctx) {
		assert<Request>(req);

		// @ts-expect-error
		assert<Bindings>(env);
		// @ts-expect-error
		assert<CustomBindings>(env);

		assert<string>(env.SECRET);
		assert<KV.Namespace>(env.DATAB);
		assert<number>(env.COUNT);

		// @ts-expect-error
		let foo = env.missing;

		return new Response;
	}
});

// attach Router entry
modules.listen(API.run);
