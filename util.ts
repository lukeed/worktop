export function toObj<T>(iter: Headers | FormData | URLSearchParams): Record<string, T | T[]> {
	let key, tmp, val, out: Record<string, T | T[]> = {};
	for ([key, val] of iter.entries()) {
		if ((tmp = out[key]) !== void 0) {
			out[key] = [].concat(tmp, val);
		} else {
			// @ts-ignore
			out[key] = val;
		}
	}
	return out;
}
