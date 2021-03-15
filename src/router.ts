import regexparam from 'regexparam';
import * as Cache from 'worktop/cache';
import { ServerResponse } from 'worktop/response';
import { STATUS_CODES } from './status';
import * as utils from './utils';

import type { Handler, Params, ServerRequest } from '..';
import type { Router as RR } from '..';

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

async function call(fn: Function, req: ServerRequest, res: ServerResponse, ...args: any[]): Promise<Response> {
	const output = await fn(req, res, ...args);
	if (output instanceof Response) return output;
	return new Response(res.body, res);
}

export function Router(): RR {
	let $: RR, tree: Tree = {};

	return $ = {
		add(method, route, handler) {
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

			return { params, handler: false };
		},

		onerror(req, res, status, error) {
			const statusText = STATUS_CODES[status = status || 500];
			const body = error && error.message || statusText || String(status);
			return new Response(body, { status, statusText });
		},

		async run(event) {
			const req = utils.request(event);
			const res = new ServerResponse(req.method);

			// TODO: options.cors?
			if ($.prepare) await $.prepare(req, res);
			if (res.finished) return new Response(res.body, res);

			const { params, handler } = $.find(req.method, req.path);
			if (!handler) return call($.onerror, req, res, 404);

			try {
				req.params = params;
				return call(handler, req, res);
			} catch (err) {
				return call($.onerror, req, res, 500, err);
			}
		},

		listen(event) {
			event.respondWith(
				Cache.lookup(event).then(prev => {
					return prev || $.run(event).then(res => {
						return Cache.save(event, res);
					});
				})
			);
		}
	};
}
