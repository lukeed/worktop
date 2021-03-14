import * as utils from './utils';

/** @type import('./cache').Cache */
export const Cache = /** @type {*} */(caches).default;

/** @type import('./cache').lookup */
export function lookup(event, request) {
	return Cache.match(request || event.request);
}

/** @type import('./cache').save */
export function save(event, res, request) {
	const req = request || event.request;
	const isGET = typeof req === 'string' || /^(GET|HEAD)$/.test(req.method);

	if (isGET && utils.isCachable(res)) {
		event.waitUntil(Cache.put(req, res.clone()));
	}

	return res;
}
