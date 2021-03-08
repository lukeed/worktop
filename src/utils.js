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
 * @param {Request} req
 * @returns {ServerRequest}
 */
export function request(req) {
	const body = toBody.bind(0, req);
	const { url, method, headers } = req;
	const { pathname:path, search, searchParams:query } = new URL(url);
	return /** @type {ServerRequest} */ ({ url, method, headers, path, query, search, body });
}

/**
 * @TODO Cast `formData` to object again?
 * @param {Request} req
 * @returns {Promise<any>}
 */
export async function toBody(req) {
	const ctype = req.headers.get('content-type');
	if (!req.body || !ctype) return;
	if (ctype.includes('application/json')) return req.json();
	if (ctype.includes('application/text')) return req.text();
	if (ctype.includes('form')) return req.formData();
	return /text\/*/i.test(ctype) ? req.text() : req.blob();
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
