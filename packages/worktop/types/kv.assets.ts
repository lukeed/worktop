import * as assets from 'worktop/cfw.kv.assets';
import type { KV } from 'worktop/kv';

declare let request: Request;
declare let binding: KV.Namespace;

assert<Function>(assets.serve);

// @ts-expect-error
assets.serve();

// @ts-expect-error
assets.serve(request);

// @ts-expect-error
assets.serve(binding, request, request);

// @ts-expect-error
assets.serve(binding, 'foobar');

assets.serve(binding, request);
assets.serve(binding, '/foo/bar');
assets.serve(binding, '/foobar');

assert<Promise<Response|void>>(
	assets.serve(binding, request)
);

assert<Response|void>(
	await assets.serve(binding, request)
);
