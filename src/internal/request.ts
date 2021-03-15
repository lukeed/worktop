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
 * @TODO Cast `formData` to object again?
 */
export async function body<T=unknown>(req: Request, ctype: string | null): Promise<T|FormData|ArrayBuffer|string|void> {
	if (!req.body || !ctype) return;
	if (!!~ctype.indexOf('application/json')) return req.json() as Promise<T>;
	if (!!~ctype.indexOf('multipart/form-data')) return req.formData();
	if (!!~ctype.indexOf('application/x-www-form-urlencoded')) return req.formData();
	return !!~ctype.indexOf('text/') ? req.text() : req.arrayBuffer();
}
