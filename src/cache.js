import * as utils from './utils';

/** @type {Cache} */
export const Cache = /** @type {*} */(caches).default;

/**
 * @param {FetchEvent} event
 * @param {Request|string} [request]
 * @returns {Promise<Response|void>}
 */
export function lookup(event, request) {
	return Cache.match(request || event.request);
}

/**
 * @param {FetchEvent} event
 * @param {Response} res
 * @param {Request|string} [request]
 * @returns {Response}
 */
export function save(event, res, request) {
	const req = request || event.request;
	const isGET = /^(GET|HEAD)$/.test(
		typeof req !== 'string' && req.method || event.request.method
	);

	if (isGET && utils.isCachable(res)) {
		event.waitUntil(Cache.put(req, res.clone()));
	}

	return res;
}
