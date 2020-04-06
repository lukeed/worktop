import { toObj } from './util';
import type { Method } from './router';

type FetchHandler = (event: FetchEvent) => Promise<Response>;

export function reply(handler: FetchHandler): EventListener {
	return function (event: FetchEvent) {
		event.respondWith(handler(event));
	};
}

export function length(res: Response): Promise<number> {
	return res.clone().arrayBuffer().then(x => x.byteLength);
}

export class ServerResponse {
	private method: Method;
	statusCode: number;
	finished: boolean;
	headers: Headers;
	body: BodyInit;

	constructor(method: Method) {
		this.body = '';
		this.statusCode = 200;
		this.headers = new Headers({
			'Cache-Control': 'private, no-cache'
		});
		this.finished = false;
		this.method = method;
	}

	get status() {
		return this.statusCode;
	}

	set status(val) {
		this.statusCode = val;
	}

	getHeaders(): Record<string, string | string[]> {
		return toObj<string>(this.headers);
	}

	getHeaderNames(): string[] {
		return [...this.headers.keys()];
	}

	getHeader(key: string): string | null {
		return this.headers.get(key.toLowerCase());
	}

	setHeader(key: string, value: string): void {
		this.headers.set(key.toLowerCase(), value);
	}

	removeHeader(key: string): void {
		this.headers.delete(key.toLowerCase());
	}

	hasHeader(key: string): boolean {
		return this.headers.has(key.toLowerCase());
	}

	end(str: BodyInit) {
		this.body = str;
    this.finished = true;
	}

	writeHead(int: number, obj?: Record<string, string>) {
		this.statusCode = int;
		for (let k in obj) {
			this.headers.set(k, obj[k]);
		}
	}

	// ---

	send(code: number, data?: unknown, headers: Record<string, string> = {}) {
		let k, obj: Record<string, string> = {};
		for (k in headers) obj[k.toLowerCase()] = headers[k];

		let type = obj['content-type'] || this.getHeader('content-type');

		if (data == null) {
			data = String(code);
		} else if (typeof data === 'object') {
			data = JSON.stringify(data);
			type = type || 'application/json;charset=utf-8';
		}

		obj['content-type'] = type || 'text/plain';
		obj['content-length'] = String((data as string).length);
		delete obj['content-length'];
		delete obj['content-type'];

		if (code === 204 || code === 304) {
			this.removeHeader('content-type');
			this.removeHeader('content-length');
			delete obj['content-length'];
			delete obj['content-type'];
			data = '';
		} else if (this.method === 'HEAD') {
			data = '';
		}

		this.writeHead(code, headers);
		this.end(data as string);
	}
}
