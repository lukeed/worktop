import regexparam from 'regexparam';
import { ServerRequest } from 'worktop/request';
import { ServerResponse } from 'worktop/response';
import { STATUS_CODES } from './internal/constants';

import type { FetchHandler, ResponseHandler } from 'worktop';
import type { Handler, Router as RR } from 'worktop';
import type { Params } from 'worktop/request';

export { STATUS_CODES };

export function reply(handler: ResponseHandler): FetchHandler {
	return event => event.respondWith(
		handler(event)
	);
}

export function listen(handler: ResponseHandler): void {
	addEventListener('fetch', reply(handler));
}

export function compose(...handlers: Handler[]): Handler {
	return async function (req, res) {
		let fn: Handler, tmp: Response|void, len=handlers.length;
		for (fn of handlers) if (tmp = await call(fn, --len<=0, req, res)) return tmp;
	};
}

interface Entry {
	keys: string[];
	handler: Handler;
}

interface Branch {
	__d: Map<RegExp, Entry>;
	__s: Record<string, Entry>;
}

type Method = string;
type Tree = Record<Method, Branch>;

async function call(fn: Function, isEnd: true, req: ServerRequest, res: ServerResponse, ...args: any[]): Promise<Response>;
async function call(fn: Function, isEnd: false, req: ServerRequest, res: ServerResponse, ...args: any[]): Promise<Response|void>;
async function call(fn: Function, isEnd: boolean, req: ServerRequest, res: ServerResponse, ...args: any[]): Promise<Response|void>;
async function call(fn: Function, isEnd: boolean, req: ServerRequest, res: ServerResponse, ...args: any[]): Promise<Response|void> {
	const output = await fn(req, res, ...args);
	if (output instanceof Response) return output;
	if (isEnd || res.finished) return new Response(res.body, res);
}

export function Router(): RR {
	let $: RR, tree: Tree = {};

	return $ = {
		add(method: string, route: RegExp | string, handler: Handler) {
			let dict = tree[method];

			if (dict === void 0) {
				dict = tree[method] = {
					__d: new Map,
					__s: {},
				};
			}

			if (route instanceof RegExp) {
				dict.__d.set(route, { keys:[], handler });
			} else if (/[:|*]/.test(route)) {
				const { keys, pattern } = regexparam(route);
				dict.__d.set(pattern, { keys, handler });
			} else {
				dict.__s[route] = { keys:[], handler };
			}
		},

		find(method, pathname) {
			let params: Params = {};
			let tmp, dict, rgx, val, match;

			if (dict = tree[method]) {
				if (tmp = dict.__s[pathname]) {
					return { params, handler: tmp.handler };
				}

				for ([rgx, val] of dict.__d) {
					match = rgx.exec(pathname);
					if (match === null) continue;
					if (match.groups !== void 0) {
						for (tmp in match.groups) {
							params[tmp] = match.groups[tmp];
						}
					} else if (val.keys.length > 0) {
						for (tmp=0; tmp < val.keys.length;) {
							params[val.keys[tmp++]] = match[tmp];
						}
					}
					return { params, handler: val.handler };
				}
			}
		},

		onerror(req, res, status, error) {
			const statusText = STATUS_CODES[status = status || 500];
			const body = error && error.message || statusText || String(status);
			return new Response(body, { status, statusText });
		},

		async run(event) {
			let tmp, req = new ServerRequest(event);
			const res = new ServerResponse(req.method);

			if ($.prepare) await $.prepare(req, res);
			if (res.finished) return new Response(res.body, res);

			tmp = $.find(req.method, req.path);
			if (!tmp) return call($.onerror, true, req, res, 404);

			try {
				req.params = tmp.params;
				return call(tmp.handler, true, req, res);
			} catch (err) {
				return call($.onerror, true, req, res, 500, err);
			}
		}
	};
}
