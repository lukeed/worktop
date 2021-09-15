import * as assets from 'worktop/kv.assets';
import type { Context } from 'worktop';
import type { KV } from 'worktop/kv';

declare let request: Request;
declare let binding: KV.Namespace;
declare let context: Context;

assert<Function>(assets.serve);

// @ts-expect-error
assets.serve();

// @ts-expect-error
assets.serve(request);

// @ts-expect-error
assets.serve(binding, request);

// @ts-expect-error
assets.serve(binding, request, request);

// @ts-expect-error
assets.serve(binding, 'foobar', context);

assets.serve(binding, request, context);
assets.serve(binding, '/foo/bar', context);
assets.serve(binding, '/foobar', context);

assert<Promise<Response|void>>(
	assets.serve(binding, request, context)
);

assert<Response|void>(
	await assets.serve(binding, request, context)
);
