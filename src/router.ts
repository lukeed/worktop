import { parse } from 'regexparam';
import { finalize, STATUS_CODES } from 'worktop/response';

import type { Handler, Router as RR } from 'worktop';
import type { Method, Params, Context } from 'worktop';
import type { Dict } from 'worktop/utils';

type HC = Handler;
type PC = Omit<Context, 'params'>;
type EC = Context & {
	status?: number;
	error?: Error;
};

export function compose(...handlers: HC[]): HC {
	return async function (req, context) {
		let fn: HC, tmp: Response|void;
		for (fn of handlers) {
			if (tmp = await fn(req, context)) return tmp;
		}
	};
}

interface Entry {
	keys: string[];
	handler: HC;
}

interface Branch {
	__d: Map<RegExp, Entry>;
	__s: Dict<Entry>;
}

type Tree = Partial<Record<Method, Branch>>;
type Route = { params: Params; handler: HC };

function find(tree: Tree, method: Method, pathname: string): Route|void {
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
}

export function Router(): RR<Context> {
	let $: RR<Context>, tree: Tree = {};

	return $ = {
		add(method: Method, route: RegExp | string, handler: HC) {
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
				const { keys, pattern } = parse(route);
				dict.__d.set(pattern, { keys, handler });
			} else {
				dict.__s[route] = { keys:[], handler };
			}
		},

		onerror(req, context) {
			let { error, status=500 } = context;
			let body = error && error.message || STATUS_CODES[status];
			return new Response(body || String(status), { status });
		},

		async run(req, context) {
			try {
				context = context || {};
				context.url = new URL(req.url);
				context.bindings = context.bindings || {};

				var res = $.prepare && await $.prepare(req, context as PC);
				if (res && res instanceof Response) return res;

				let tmp = find(tree, req.method as Method, context.url.pathname);
				if (!tmp) return (context as EC).status=404, res=await $.onerror(req, context as Context);

				context.params = tmp.params;
				res = await tmp.handler(req, context as Context);
			} catch (err) {
				(context as EC).status = 500;
				(context as EC).error = err as Error;
				res = await $.onerror(req, context as Context);
			} finally {
				res = res || new Response('OK');
				return finalize(res, req.method === 'HEAD');
			}
		}
	};
}
