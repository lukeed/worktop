import regexparam from 'regexparam';
import * as Cache from 'worktop/cache';
import { ServerResponse } from './response';
import { STATUS_CODES } from './status';
import * as utils from './utils';

/**
 * @param {Function} fn
 * @param {import('..').ServerRequest} req
 * @param {import('..').ServerResponse} res
 * @param  {...any} args
 * @returns {Promise<Response>}
 */
async function call(fn, req, res, ...args) {
	const output = await fn(req, res, ...args);
	if (output instanceof Response) return output;
	return new Response(res.body, res);
}

/**
 * @typedef {import('..').Router} Router
 * @typedef {import('..').Handler} Handler
 * @typedef {import('..').Params} Params
 * @typedef {import('..').Route} Route
 */

/**
 * @typedef Entry
 * @property {string[]} keys
 * @property {Handler} handler
 */

/**
 * @typedef Branch
 * @property {Map<RegExp, Entry>} __d
 * @property {Record<string, Entry>} __s
 */

/**
 * @typedef Tree
 * @type {Record<string, Branch>}
 */

/** @returns {Router} */
export function Router() {
	/** @type {Router} */let $;
	/** @type {Tree} */let tree={};

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
			/** @type {Params} */let params={};
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
