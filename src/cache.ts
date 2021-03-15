import { isCachable } from './internal/utils';

export const Cache: Cache = (caches as any).default;

export function lookup(event: FetchEvent, request?: Request | string) {
	return Cache.match(request || event.request);
}

export function save(event: FetchEvent, res: Response, request?: Request | string) {
	const req = request || event.request;
	const isGET = typeof req === 'string' || /^(GET|HEAD)$/.test(req.method);

	if (isGET && isCachable(res)) {
		event.waitUntil(Cache.put(req, res.clone()));
	}

	return res;
}
