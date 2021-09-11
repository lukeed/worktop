import { Router, compose } from 'worktop';

import type { Params, ServerRequest } from 'worktop/request';
import type { IncomingCloudflareProperties } from 'worktop/request';
import type { ServerResponse } from 'worktop/response';
import type { RouteParams } from 'worktop';

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
	assert<string>(req.origin);
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

declare const event: FetchEvent;

// @ts-expect-error
await API.run('hello');

const res1 = await API.run(event);
assert<Response>(res1);

const res2 = API.run(event);
assert<Promise<Response>>(res2);

/**
 * PARAMS / RouteParams
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

/**
 * ROUTES w/ RouteParams
 */

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
 * COMPOSE w/ RouteParams
 */

API.add('GET', '/foo/:bar?', compose(
	(req, res) => {
		assert<string|void>(req.params.bar);
	},
	async (req, res) => {
		assert<string|void>(req.params.bar);
		res.end('hello');
	},
	// @ts-expect-error
	(req, res) => {
		assert<string|void>(req.params.bar);
		return 123;
	}
));

/**
 * PREPARE
 */

// Can be a Handler
API.prepare = compose(
	(req, res) => {},
	(req, res) => {},
	(req, res) => {},
);

// Can be a Handler
API.prepare = function (req, res) {
	// @ts-expect-error
	req.params; // does not exist
	// can now return Response instance~!
	return new Response(null, { status: 204 });
}

// @ts-expect-error - numerical
API.prepare = (req, res) => 123;
