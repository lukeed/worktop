import regexparam from 'regexparam';
import { toBody, toReq } from './request';
import { ServerResponse } from './response';
import { isCachable, toCache } from './cache';
import type { ServerRequest } from './request';

export type Params = Record<string, string>;
export type Handler = (req: ServerRequest, res: ServerResponse) => void | Response | Promise<void | Response>;
export type Method = 'GET' | 'HEAD' | 'POST' | 'PATCH' | 'OPTIONS' | 'DELETE' | 'PUT';

export interface Entry {
	keys: string[];
	handler: Handler;
}

export type RouteDict = Record<string, Entry> & {
	__roots__: Map<RegExp, Entry>;
}

export interface Route {
	params: Params;
	handler: Handler | false;
}

export class Router {
	tree: Partial<Record<Method, RouteDict>>;

	constructor() {
		this.tree = {};
		this.listen = this.listen.bind(this);
	}

	add(method: Method, route: string | RegExp, handler: Handler): void {
		if (this.tree[method] === void 0) {
			Object.defineProperty(this.tree, method, {
				value: { __roots__: new Map() }
			});
		}

		if (route instanceof RegExp) {
			this.tree[method].__roots__.set(route, { keys:[], handler });
		} else if (/[:|*]/.test(route)) {
			const { keys, pattern } = regexparam(route);
			this.tree[method].__roots__.set(pattern, { keys, handler });
		} else {
			Object.defineProperty(this.tree[method], route, {
				value: { keys:[], handler }
			});
		}
	}

	find(method: Method, pathname: string): Route {
		let tmp, match, params: Params = {}, dict = this.tree[method];
		if ((tmp = dict[pathname]) !== void 0) {
			return { params, handler: tmp.handler };
		}

		for (const [rgx, val] of dict.__roots__) {
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

		return { params, handler: false };
	}

	async run(request: Request): Promise<Response> {
		const req = toReq(request);
		const { params, handler } = this.find(req.method as Method, req.path);
		if (!handler) return new Response('404', { status: 404 });

		if (request.body) {
			try {
				const ctype = req.headers.get('content-type');
				if (ctype) req.body = await toBody(request, ctype);
			} catch (err) {
				return new Response(err.message, { status: 400 });
			}
		}

		try {
			req.params = params;
			const res = new ServerResponse(req.method);
			const out = await handler(req, res);
			if (out instanceof Response) return out;
			if (res.finished) return new Response(res.body, res);
		} catch (err) {
			// TODO: onError
			return new Response(err.message, { status: 500 });
		}
	}

	listen(event: FetchEvent): void {
		event.respondWith(
			this.run(event.request).then(res => {
				const isGET = /^(GET|HEAD)$/.test(event.request.method);
				return isGET && isCachable(res) ? toCache(event, res) : res;
			})
		);
	}
}
