import type { Bindings, Context, Initializer } from 'worktop';
import type { ResponseHandler } from 'worktop/cache';
import type { Module } from 'worktop/modules';

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

export function isCacheable(res: Response): boolean {
	if (res.status === 206) return false;

	const vary = res.headers.get('Vary') || '';
	if (!!~vary.indexOf('*')) return false;

	const ccontrol = res.headers.get('Cache-Control') || '';
	if (/(private|no-cache|no-store)/i.test(ccontrol)) return false;

	return true;
}

// Generate a Module Worker definition from an `Initializer` type.
export function reply<
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

// initializer: Service Worker
export function listen(handler: ResponseHandler): void {
	addEventListener('fetch', event => {
		event.respondWith(
			lookup(event.request).then(prev => {
				return prev || handler(event).then(res => {
					return save(event.request, res, event);
				});
			})
		);
	});
}
