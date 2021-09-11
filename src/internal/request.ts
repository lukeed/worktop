type Arrayable<T> = T | Array<T>;
type DataObject = Record<string, Arrayable<FormDataEntryValue>>;

/**
 * Converts a (Headers|FormData|URLSearchParams) into an Object.
 * Is similar to `Object.fromEntries` except can collect multiple values for same key.
 */
export function toObject(iter: Headers | FormData | URLSearchParams): DataObject {
	let key, val, tmp: Arrayable<FormDataEntryValue>, out: DataObject = {};
	for ([key, val] of iter) {
    out[key] = (tmp = out[key]) !== void 0 ? ([] as FormDataEntryValue[]).concat(tmp, val) : val;
	}
	return out;
}
