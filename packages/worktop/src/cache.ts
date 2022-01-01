import type { Module } from 'worktop/cfw';
import type { Handler } from 'worktop';

export const Cache = /*#__PURE__*/ caches.default;

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

// TODO: Add `cache?` param throughout?
// ~> would make cache target configurable
// ~> and `caches.default` is Cloudflare-only
export function sync(): Handler {
	return async function (req, context) {
		let r = await lookup(req);
		if (r) return r;

		context.defer(res => {
			save(req, res, context);
		});
	};
}
