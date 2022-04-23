import type { Handler } from 'worktop';

export async function lookup(cache: Cache, req: Request | string) {
	let isHEAD = typeof req !== 'string' && req.method === 'HEAD';
	if (isHEAD) req = new Request(req, { method: 'GET' });

	let res = await cache.match(req);
	if (isHEAD && res) res = new Response(null, res);
	return res;
}

export function save(
	cache: Cache,
	request: Request | string,
	response: Response,
	context: {
		waitUntil(f: any): void;
	}
) {
	let isGET = typeof request === 'string' || request.method === 'GET';

	if (isGET && isCacheable(response)) {
		if (response.headers.has('Set-Cookie')) {
			response = new Response(response.body, response);
			response.headers.append('Cache-Control', 'private=Set-Cookie');
		}
		context.waitUntil(
			cache.put(request, response.clone())
		);
	}

	return response;
}

// @see https://datatracker.ietf.org/doc/html/rfc7231#section-6.1
// @see (-206) https://developers.cloudflare.com/workers/runtime-apis/cache/#invalid-parameters
const CACHE_CODES = /*#__PURE__*/ new Set([200, 203, 204, 300, 301, 404, 405, 410, 414, 501]);

export function isCacheable(res: Response): boolean {
	if (!CACHE_CODES.has(res.status)) return false;

	let vary = res.headers.get('Vary') || '';
	if (!!~vary.indexOf('*')) return false;

	let ccontrol = res.headers.get('Cache-Control') || '';
	if (/(private|no-cache|no-store)/i.test(ccontrol)) return false;

	return true;
}

export function sync(cache: Cache): Handler {
	return async function (req, context) {
		let r = await lookup(cache, req);
		if (r) return r;

		context.defer(res => {
			save(cache, req, res, context);
		});
	};
}
