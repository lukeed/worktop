// /**
//  * @template T
//  * @typedef Dict<T>
//  * @type {Record<string, T>}
//  */

// /**
//  * Converts a (Headers|FormData|URLSearchParams) into an Object.
//  * Is similar to `Object.fromEntries` except can collect multiple values for same key.
//  * @param {Headers|FormData|URLSearchParams} iter
//  * @returns {Dict<string|string[]>}
//  */
// export function toObject(iter) {
// 	let key, tmp, val, out = /** @type {Dict<string|string[]>} */({});
// 	for ([key, val] of iter) {
// 		if ((tmp = out[key]) !== void 0) {
// 			out[key] = [].concat(tmp, val);
// 		} else {
// 			out[key] = val;
// 		}
// 	}
// 	return out;
// }

/**
 * @typedef {import('..').ServerRequest} ServerRequest
 */

/**
 * @TODO Cast `query` as object again?
 * @param {FetchEvent} event
 * @returns {ServerRequest}
 */
export function request(event) {
	const { request, waitUntil } = event;
	const { url, method, headers } = request; // todo: cf
	const { hostname, pathname, search, searchParams } = new URL(url);
	const ctype = headers.get('content-type');
	return /** @type {ServerRequest} */ ({
		url, method, headers,
		hostname, path: pathname,
		search, query: searchParams,
		body: body.bind(0, request, ctype),
		extend: waitUntil
	});
}

/**
 * @TODO Cast `formData` to object again?
 * @param {Request} req
 * @param {string|null} ctype
 * @returns {Promise<any>}
 */
export async function body(req, ctype) {
	if (!req.body || !ctype) return;
	if (!!~ctype.indexOf('application/json')) return req.json();
	if (!!~ctype.indexOf('multipart/form-data')) return req.formData();
	if (!!~ctype.indexOf('application/x-www-form-urlencoded')) return req.formData();
	return !!~ctype.indexOf('text/') ? req.text() : req.arrayBuffer();
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
