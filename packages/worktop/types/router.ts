import { Router, compose } from 'worktop';

import type { Params, Context } from 'worktop';
import type { IncomingCloudflareProperties } from 'worktop/cfw';
import type { RouteParams } from 'worktop';

declare const mcontext: Context;
declare const request: Request;

// @ts-expect-error
const invalid = Router();

// valid instantiation
const API = new Router();
assert<Router>(API);

// @ts-expect-error
await API.run('hello');

const res1 = API.run(request, mcontext);
assert<Promise<Response>>(res1);
assert<Response>(await res1);

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
	assert<Context>(context);

	// Assert `req` properties
	assert<string>(req.url);
	assert<string>(req.method);
	assert<Headers>(req.headers);
	assert<ReadableStream<Uint8Array>|null>(req.body);

	// Assert body parsers
	assert<any>(await req.json());
	assert<Item>(await req.json() as Item);
	assert<ArrayBuffer>(await req.arrayBuffer());
	assert<FormData>(await req.formData());
	assert<string>(await req.text());
	assert<Blob>(await req.blob());

	// Assert context properties
	assert<object>(context.params);
	assert<URL>(context.url);
	assert<string>(context.url.origin);
	assert<string>(context.url.hostname);
	assert<string>(context.url.search);
	assert<URLSearchParams>(context.url.searchParams);
	// assert<URLSearchParams>(context.url.query); // TODO: alias
	assert<Function|void>(context.passThroughOnException);
	assert<(f:any)=>void>(context.waitUntil);

	// Assert `req.extend` usage
	// req.extend(async function () {}());
	// req.extend(fetch('/analytics'));
	// req.extend(function () {}());

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
	assert<string>(context.params.anything);
});

/**
 * COMPOSE w/ RouteParams
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

/**
 * MOUNT
 */

// @ts-expect-error
API.mount(/foo/, API);

// @ts-expect-error
API.mount('foo/', API);

// @ts-expect-error
API.mount('/foo', API);

API.mount('/foo/', API);
API.mount('/foo/bar/', API);
