import type { Attributes } from 'worktop/cookie';

const ATTRS = new Set([
	'domain', 'path', 'max-age', 'expires',
	'samesite', 'secure', 'httponly',
]);

type Cookie = Attributes & Record<string, string>;
export function parse(cookie: string): Cookie {
	let out: Cookie = {}, idx: number, tmp: string;
	let i=0, arr=cookie.split(/;\s*/g);
	let key: string, val: string;

	for (; i < arr.length; i++) {
		tmp = arr[i];
		idx = tmp.indexOf('=');

		if (!!~idx) {
			key = tmp.substring(0, idx++).trim();
			val = tmp.substring(idx).trim();
			if (val[0] === '"') {
				val = val.substring(1, val.length - 1);
			}
			if (!!~val.indexOf('%')) {
				try { val = decodeURIComponent(val) }
				catch (err) { /* ignore */ }
			}
			if (ATTRS.has(tmp = key.toLowerCase())) {
				if (tmp === 'expires') out.expires = new Date(val);
				else if (tmp === 'max-age') out.maxage = +val;
				else out[tmp] = val;
			} else {
				out[key] = val;
			}
		} else if (key = tmp.trim().toLowerCase()) {
			if (key === 'httponly' || key === 'secure') {
				out[key] = true;
			}
		}
	}

	return out;
}

type Options = Omit<Attributes, 'expires'> & { expires?: Date | string | number };
export function stringify(name: string, value: string, options: Options = {}): string {
	let str = name + '=' + encodeURIComponent(value);

	if (options.expires) {
		str += '; Expires=' + new Date(options.expires).toUTCString();
	}

	if (options.maxage != null && options.maxage >= 0) {
		str += '; Max-Age=' + (options.maxage | 0);
	}

	if (options.domain) {
		str += '; Domain=' + options.domain;
	}

	if (options.path) {
		str += '; Path=' + options.path;
	}

	if (options.samesite) {
		str += '; SameSite=' + options.samesite;
	}

	if (options.secure || options.samesite === 'None') str += '; Secure';
	if (options.httponly) str += '; HttpOnly';

	return str;
}
