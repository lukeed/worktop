// @ts-ignore
export const Cache = caches.default;

/**
 * @param {FetchEvent} event
 * @param {Response} res
 * @returns {Response}
 */
export function toCache(event, res) {
	event.waitUntil(Cache.put(event.request, res.clone()));
	return res;
}

/**
 * @param {Response} res
 * @returns {boolean}
 */
export function isCachable(res) {
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
