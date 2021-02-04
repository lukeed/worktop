import regexparam from 'regexparam';
import * as Cache from 'worktop/cache';
import { ServerResponse } from './response';
import * as utils from './utils';

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

		async run(request) {
			const req = utils.request(request);
			const { params, handler } = $.find(req.method, req.path);
			if (!handler) return new Response('404', { status: 404 });

			if (request.body) {
				try {
					const ctype = req.headers.get('content-type');
					if (ctype) req.body = await utils.body(request, ctype);
				} catch (err) {
					return new Response(err.message, { status: 400 });
				}
			}

			try {
				req.params = params;
				const res = new ServerResponse(req.method);

				const out = await handler(req, res);
				if (out instanceof Response) return out;
				return new Response(res.body, res);
			} catch (err) {
				// TODO: onError
				return new Response(err.message, { status: 500 });
			}
		},

		listen(event) {
			event.respondWith(
				Cache.lookup(event).then(prev => {
					return prev || $.run(event.request).then(res => {
						return Cache.save(event, res);
					});
				})
			);
		}
	};
}
