/**
 * @param {import('..').ResponseHandler} handler
 * @returns {import('..').FetchHandler}
 */
export function reply(handler) {
	return function (event) {
		event.respondWith(
			handler(event)
		);
	};
}

// /**
//  * @param {Response} res
//  * @returns {Promise<number>}
//  */
// export function length(res) {
// 	return res.clone().arrayBuffer().then(x => x.byteLength);
// }

/**
 * @template T
 * @typedef Writable<T>
 * @type {{ -readonly [P in keyof T]: T[P] }}
 */

/**
 * @typedef {import('..').ServerResponse} SR
 */

/**
 * @this {Writable<SR>}
 * @param {string} method
 * @returns {SR}
 */
export function ServerResponse(method) {
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
		/** @param {number} x */
		set: x => { this.statusCode = x },
		get: () => this.statusCode,
	});

	/** @type {SR['end']} */
	this.end = (data) => {
		this.body = data;
		this.finished = true;
	}

	/** @type {SR['writeHead']} */
	this.writeHead = (code, heads) => {
		this.statusCode = code;
		for (let k in heads) {
			hh.set(k, heads[k]);
		}
	}

	/**
	 * @type {SR['send']}
	 * @TODO Remove / extract?
	 * @see https://github.com/lukeed/polka/blob/next/packages/send/index.js
	 */
	this.send = (code, data, headers) => {
		/** @type {Record<string,string|number>} */let obj={};
		for (let key in headers) obj[key.toLowerCase()] = headers[key];
		let type = obj['content-type'] || this.getHeader('content-type');

		if (data == null) {
			data = String(code);
		} else if (typeof data === 'object') {
			data = JSON.stringify(data);
			type = type || 'application/json;charset=utf-8';
		}

		obj['content-type'] = type || 'text/plain';
		obj['content-length'] = String(data).length;
		delete obj['content-length'];
		delete obj['content-type'];

		if (code === 204 || code === 304) {
			this.removeHeader('content-type');
			this.removeHeader('content-length');
			delete obj['content-length'];
			delete obj['content-type'];
			data = '';
		} else if (method === 'HEAD') {
			data = '';
		}

		this.writeHead(code, headers);
		this.end(data);
	}

	return this;
}
