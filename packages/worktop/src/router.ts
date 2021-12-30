import { parse } from 'regexparam';
import { finalize, STATUS_CODES } from 'worktop/response';

import type { Handler, Deferral } from 'worktop';
import type { Method, Params, Context } from 'worktop';
import type { Initializer, Router as RR } from 'worktop';
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
type Mounts = Dict<Initializer<Context>>;

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
	let $: RR<Context>, mounts: Mounts, tree: Tree = {};

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

		mount(prefix, router) {
			mounts = mounts || {};
			mounts[prefix] = router.run;
		},

		onerror(req, context) {
			let { error, status=500 } = context;
			let body = error && error.message || STATUS_CODES[status];
			return new Response(body || String(status), { status });
		},

		async run(req, context) {
			try {
				var defer: Deferral | void;
				var queue: Deferral[] = [];

				context = context || {} as Context;
				context.url = new URL(req.url);
				context.defer = f => { queue.push(f) };
				context.bindings = context.bindings || {};

				var res = $.prepare && await $.prepare(req, context as PC);
				if (res && res instanceof Response) return res;

				let tmp, path = context.url.pathname, x = path+'/';
				if (mounts && path.length > 1) for (tmp in mounts) {
					if (x.startsWith(tmp)) {
						context.url.pathname = path.substring(tmp.length) || '/';
						return res = await mounts[tmp](new Request(context.url.href, req), context);
					}
				}

				tmp = find(tree, req.method as Method, path);
				if (!tmp) return (context as EC).status=404, res=await $.onerror(req, context as Context);

				context.params = tmp.params;
				res = await tmp.handler(req, context as Context);
			} catch (err) {
				(context as EC).status = 500;
				(context as EC).error = err as Error;
				res = await $.onerror(req, context as Context);
			} finally {
				res = new Response(res ? res.body : 'OK', res!);
				while (defer = queue!.pop()) await defer(res);
				return finalize(res, req.method === 'HEAD');
			}
		}
	};
}
