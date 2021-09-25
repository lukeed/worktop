import { Encoder } from 'worktop/buffer';
import type { Dict } from 'worktop/utils';

// @see https://github.com/lukeed/uuid
export const uuid = () => crypto.randomUUID();

// Alphabet for `uid` generator
const ALPHANUM = /*#__PURE__*/ 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_';

// @see https://github.com/lukeed/uid
export function uid(len?: number): string {
	var str='', num=len||11, arr=randomize(num);
	while (num--) str += ALPHANUM[arr[num] & 63];
	return str;
}

// (ulid) Crockford's Base32
const BASE32 = /*#__PURE__*/ '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

// @see https://github.com/ulid/spec
export function ulid(): string {
	var str='', num=16, now=Date.now();
	var tmp: number, maxlen = BASE32.length;
	var arr = randomize(num);

	while (num--) {
		tmp = arr[num] / 255 * maxlen | 0;
		if (tmp === maxlen) tmp = 31;
		str = BASE32.charAt(tmp) + str;
	}

	for (num=10; num--;) {
		tmp = now % maxlen;
		now = (now - tmp) / maxlen;
		str = BASE32.charAt(tmp) + str;
	}

	return str;
}

export function randomize(length: number): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(length));
}

export function byteLength(input?: string): number {
	return input ? Encoder.encode(input).byteLength : 0;
}

/**
 * Parse `Request|Response` body according to its `Content-Type` header.
 * @NOTE Converts `FormData` into an object.
 */
export async function body<T>(input: Request | Response): Promise<T|void> {
	let ctype = input.headers.get('content-type');

	if (!input.body || !ctype) return;
	if (!!~ctype.indexOf('application/json')) return input.json() as Promise<T>;
	if (!!~ctype.indexOf('multipart/form-data')) return input.formData().then(toObject) as Promise<T>;
	if (!!~ctype.indexOf('application/x-www-form-urlencoded')) return input.formData().then(toObject) as Promise<T>;
	return !!~ctype.indexOf('text/') ? input.text() : input.arrayBuffer() as Promise<any>;
}

/**
 * Converts an `Iterable` into an object.
 * @NOTE Like `Object.fromEntries`, but can collect multiple values for same key.
 */
export function toObject<T>(iter: Iterable<[string, T]>): Dict<T|T[]> {
	let key: string, val: T, tmp: T|T[], out: Dict<T|T[]> = {};
	for ([key, val] of iter) {
		out[key] = (tmp=out[key]) === void 0 ? val : ([] as T[]).concat(tmp, val);
	}
	return out;
}
