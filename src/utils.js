/**
 * Converts a (Headers|FormData|URLSearchParams) into an Object.
 * Is similar to `Object.fromEntries` except can collect multiple values for same key.
 * @param {Headers|FormData|URLSearchParams} iter
 * @returns {Record<string, string|string[]>}
 */
export function toObject(iter) {
	let key, tmp, val, out={};
	for ([key, val] of iter) {
		if ((tmp = out[key]) !== void 0) {
			out[key] = [].concat(tmp, val);
		} else {
			out[key] = val;
		}
	}
	return out;
}
