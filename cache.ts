export const Cache: Cache = (caches as any).default;

export function toCache(event: FetchEvent, res: Response): Response {
	event.waitUntil(Cache.put(event.request, res.clone()));
	return res;
}

export function isCachable(res: Response): boolean {
	if (res.status === 206) return false;

	const vary = res.headers.get('Vary') || '';
	if (vary.includes('*')) return false;

	const ccontrol = res.headers.get('Cache-Control') || '';
	if (/(private|no-cache|no-store)/i.test(ccontrol)) return false;

	if (res.headers.has('Set-Cookie')) {
		res.headers.append('Cache-Control', 'private=Set-Cookie');
	}

	return true;
}
