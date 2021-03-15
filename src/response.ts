import { CLENGTH, CTYPE } from './internal/constants';

import type { FetchHandler, ResponseHandler } from 'worktop/response';
import type { HeadersObject, ServerResponse as SR } from 'worktop/response';

type Writable<T> = {
	-readonly [P in keyof T]: T[P]
};

export function reply(handler: ResponseHandler): FetchHandler {
	return event => event.respondWith(
		handler(event)
	);
}

export function ServerResponse(this: Writable<SR>, method: string): SR {
	var hh = this.headers = new Headers({
		'Cache-Control': 'private, no-cache'
	});

	this.body = '';
	this.finished = false;
	this.status = this.statusCode = 200;

	this.getHeaders = () => Object.fromEntries(hh);
	this.getHeaderNames = () => [...hh.keys()];

	this.hasHeader = hh.has.bind(hh);
	this.getHeader = hh.get.bind(hh);
	this.removeHeader = hh.delete.bind(hh);
	this.setHeader = hh.set.bind(hh);

	Object.defineProperty(this, 'status', {
		set: (x: number) => { this.statusCode = x },
		get: () => this.statusCode,
	});

	this.end = (data) => {
		if (this.finished) return;
		this.finished = true;
		this.body = data;
	}

	this.writeHead = (code, heads) => {
		this.statusCode = code;
		for (let k in heads) {
			hh.set(k, heads[k]);
		}
	}

	/**
	 * @TODO Remove / extract?
	 * @see https://github.com/lukeed/polka/blob/next/packages/send/index.js
	 */
	this.send = (code, data, headers) => {
		let obj: HeadersObject = {};
		for (let key in headers) obj[key.toLowerCase()] = headers[key];
		let len = obj[CLENGTH] || this.getHeader(CLENGTH);
		let type = obj[CTYPE] || this.getHeader(CTYPE);

		if (data == null) {
			data = '';
		} else if (typeof data === 'object') {
			data = JSON.stringify(data);
			type = type || 'application/json;charset=utf-8';
		}

		obj[CTYPE] = type || 'text/plain';
		obj[CLENGTH] = len || String(
			data.byteLength || new TextEncoder().encode(data).byteLength
		);

		if (code === 204 || code === 205 || code === 304) {
			this.removeHeader(CLENGTH);
			this.removeHeader(CTYPE);
			delete obj[CLENGTH];
			delete obj[CTYPE];
			data = null;
		} else if (method === 'HEAD') {
			data = null;
		}

		this.writeHead(code, obj);
		this.end(data);
	}

	return this;
}
