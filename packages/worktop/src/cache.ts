import type { Context, Initializer } from 'worktop';
import type { Module, Bindings } from 'worktop/cfw';

export const Cache: Cache = /*#__PURE__*/ (caches as any).default;

export async function lookup(req: Request | string) {
	let isHEAD = typeof req !== 'string' && req.method === 'HEAD';
	if (isHEAD) req = new Request(req, { method: 'GET' });

	let res = await Cache.match(req);
	if (isHEAD && res) res = new Response(null, res);
	return res;
}

export function save(req: Request | string, res: Response, context: Module.Context) {
	let isGET = typeof req === 'string' || req.method === 'GET';

	if (isGET && isCacheable(res)) {
		if (res.headers.has('Set-Cookie')) {
			res = new Response(res.body, res);
			res.headers.append('Cache-Control', 'private=Set-Cookie');
		}
		context.waitUntil(Cache.put(req, res.clone()));
	}

	return res;
}

// TODO: Check if other codes (eg 500) actually work in CF cache
// @see https://datatracker.ietf.org/doc/html/rfc7231#section-6.1
export function isCacheable(res: Response): boolean {
	if (res.status === 101 || res.status === 206) return false;

	const vary = res.headers.get('Vary') || '';
	if (!!~vary.indexOf('*')) return false;

	const ccontrol = res.headers.get('Cache-Control') || '';
	if (/(private|no-cache|no-store)/i.test(ccontrol)) return false;

	return true;
}

// Generate a Module Worker definition from an `Initializer` type.
export function start<
	C extends Context = Context,
	B extends Bindings = Bindings,
>(run: Initializer<C>): Module.Worker<B> {
	return {
		async fetch(req, env, ctx) {
			let res = await lookup(req);
			if (res) return res;

			(ctx as C).bindings = env;
			res = await run(req, ctx as C);
			return save(req, res, ctx);
		}
	}
}
