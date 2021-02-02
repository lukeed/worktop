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
	const { url, method, headers } = req;
	const { pathname:path, search, searchParams:query } = new URL(url);
	return /** @type {ServerRequest} */ ({ url, method, headers, path, query, search, body: null });
}

/**
 * @TODO Cast `formData` to object again?
 * @param {Request} req
 * @param {string} ctype
 * @returns {Promise<any>}
 */
export function body(req, ctype) {
	if (ctype.includes('application/json')) return req.json();
	if (ctype.includes('application/text')) return req.text();
	if (ctype.includes('form')) return req.formData();
	return /text\/*/i.test(ctype) ? req.text() : req.blob();
}
