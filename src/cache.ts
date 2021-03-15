export const Cache: Cache = (caches as any).default;

export function lookup(event: FetchEvent, request?: Request | string) {
	return Cache.match(request || event.request);
}

export function save(event: FetchEvent, res: Response, request?: Request | string) {
	const req = request || event.request;
	const isGET = typeof req === 'string' || /^(GET|HEAD)$/.test(req.method);

	if (isGET && isCacheable(res)) {
		event.waitUntil(Cache.put(req, res.clone()));
	}

	return res;
}

export function isCacheable(res: Response): boolean {
	if (res.status === 206) return false;

	const vary = res.headers.get('Vary') || '';
	if (!!~vary.indexOf('*')) return false;

	const ccontrol = res.headers.get('Cache-Control') || '';
	if (/(private|no-cache|no-store)/i.test(ccontrol)) return false;

	if (res.headers.has('Set-Cookie')) {
		res.headers.append('Cache-Control', 'private=Set-Cookie');
	}

	return true;
}
