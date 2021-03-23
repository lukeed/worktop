import { byteLength } from 'worktop/utils';
import { CLENGTH, CTYPE } from './internal/constants';

import type { HeadersObject, ServerResponse as SR } from 'worktop/response';

type Writable<T> = {
	-readonly [P in keyof T]: T[P]
};

export function ServerResponse(this: Writable<SR>, method: string): SR {
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

	/**
	 * @TODO Remove / extract?
	 * @see https://github.com/lukeed/polka/blob/next/packages/send/index.js
	 */
	$.send = (code, data, headers) => {
		let obj: HeadersObject = {};
		for (let key in headers) obj[key.toLowerCase()] = headers[key];
		let len = obj[CLENGTH] || $.getHeader(CLENGTH);
		let type = obj[CTYPE] || $.getHeader(CTYPE);

		if (data == null) {
			data = '';
		} else if (typeof data === 'object') {
			data = JSON.stringify(data);
			type = type || 'application/json;charset=utf-8';
		}

		obj[CTYPE] = type || 'text/plain';
		obj[CLENGTH] = len || String(
			data.byteLength || byteLength(data)
		);

		if (code === 204 || code === 205 || code === 304) {
			$.removeHeader(CLENGTH);
			$.removeHeader(CTYPE);
			delete obj[CLENGTH];
			delete obj[CTYPE];
			data = null;
		} else if (method === 'HEAD') {
			data = null;
		}

		$.writeHead(code, obj);
		$.end(data);
	}

	return $;
}
