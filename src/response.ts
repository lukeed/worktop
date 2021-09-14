import { byteLength } from 'worktop/utils';
import type { HeadersObject } from 'worktop/response';
import type { ServerResponse as SR } from 'worktop/response';

type Writable<T> = {
	-readonly [P in keyof T]: T[P]
};

const CTYPE = /*#__PURE__*/ 'content-type';
const CLENGTH = /*#__PURE__*/ 'content-length';

/**
 * Common Error Codes
 */
export const STATUS_CODES: Record<string|number, string> = {
	'400': 'Bad Request',
	'401': 'Unauthorized',
	'403': 'Forbidden',
	'404': 'Not Found',
	'405': 'Method Not Allowed',
	'406': 'Not Acceptable',
	'409': 'Conflict',
	'410': 'Gone',
	'411': 'Length Required',
	'413': 'Payload Too Large',
	'422': 'Unprocessable Entity',
	'426': 'Upgrade Required',
	'428': 'Precondition Required',
	'429': 'Too Many Requests',
	'500': 'Internal Server Error',
	'501': 'Not Implemented',
	'502': 'Bad Gateway',
	'503': 'Service Unavailable',
	'504': 'Gateway Timeout',
};

/**
 * Auto-serialize `data` to a `Response` object.
 * @see https://github.com/lukeed/polka/blob/next/packages/send/index.js
 */
export function send(status: number, data?: any, headers?: HeadersObject): Response {
	let obj: HeadersObject = {};
	for (let key in headers) {
		obj[key.toLowerCase()] = headers[key];
	}

	let type = obj[CTYPE];
	let dtype = typeof data;

	if (data == null) {
		data = '';
	} else if (dtype === 'object') {
		data = JSON.stringify(data);
		type = type || 'application/json;charset=utf-8';
	} else if (dtype !== 'string') {
		data = String(data);
	}

	obj[CTYPE] = type || 'text/plain';
	obj[CLENGTH] = obj[CLENGTH] || String(
		data.byteLength || byteLength(data)
	);

	return new Response(data, { status, headers: obj as HeadersInit });
}

// NOTE: cloudflare handles all this automatically...
const EMPTYs = /*#__PURE__*/ new Set([101, 204, 205, 304]);
export function finalize(res: Response, isHEAD?: boolean): Response {
	let isEmpty = EMPTYs.has(res.status);
	if (!isHEAD && !isEmpty) return res;

	let copy = new Response(null, res);
	if (isEmpty) copy.headers.delete(CLENGTH);
	if (res.status === 205) copy.headers.set(CLENGTH, '0');
	return copy;
}

export function ServerResponse(this: Writable<SR>): SR {
	var $ = this, hh = $.headers = new Headers({
		'Cache-Control': 'private, no-cache'
	});

	$.body = '';
	$.finished = false;
	$.status = $.statusCode = 200;

	$.getHeaders = () => Object.fromEntries(hh);
	$.getHeaderNames = () => [...hh.keys()];

	$.hasHeader = hh.has.bind(hh);
	$.getHeader = hh.get.bind(hh);
	$.removeHeader = hh.delete.bind(hh);
	$.setHeader = hh.set.bind(hh);

	Object.defineProperty($, 'status', {
		set: (x: number) => { $.statusCode = x },
		get: () => $.statusCode,
	});

	$.end = (data) => {
		if ($.finished) return;
		$.finished = true;
		$.body = data;
	}

	$.writeHead = (code, heads) => {
		$.statusCode = code;
		for (let k in heads) {
			hh.set(k, heads[k]);
		}
	}

	$.send = (code, data, headers) => {
		let k, v, res = send(code, data, {
			[CLENGTH]: $.getHeader(CLENGTH)!,
			[CTYPE]: $.getHeader(CTYPE)!,
			...headers,
		});
		for ([k,v] of res.headers) hh.set(k, v);
		$.statusCode = res.status;
		$.end(res.body);
	};

	return $;
}
