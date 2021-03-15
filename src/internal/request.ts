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

export async function body<T=unknown>(req: Request, ctype: string | null): Promise<T|ArrayBuffer|string|void> {
	if (!req.body || !ctype) return;
	if (!!~ctype.indexOf('application/json')) return req.json() as Promise<T>;
	if (!!~ctype.indexOf('multipart/form-data')) return req.formData().then(toObject) as Promise<T>;
	if (!!~ctype.indexOf('application/x-www-form-urlencoded')) return req.formData().then(toObject) as Promise<T>;
	return !!~ctype.indexOf('text/') ? req.text() : req.arrayBuffer();
}
