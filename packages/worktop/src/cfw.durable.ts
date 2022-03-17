import { connect } from 'worktop/ws';
import { reply } from 'worktop/response';
import { lookup } from 'worktop/cache';

import type { Dict } from 'worktop/utils';
import type { Bindings } from 'worktop/cfw';
import type { WebSocket } from 'worktop/cfw.ws';
import type { Database as DB } from 'worktop/cfw.durable';
import type { Durable } from 'worktop/cfw.durable';

export abstract class Actor {
	DEBUG: boolean;

	constructor(state: Durable.State, bindings: Bindings) {
		if (this.setup) state.blockConcurrencyWhile(() => this.setup!(state, bindings));
		this.DEBUG = false;
	}

	setup?(state: Durable.State, bindings: Bindings): Promise<void> | void;
	onconnect?(req: Request, ws: WebSocket): Promise<void> | void;

	abstract receive(req: Request): Promise<Response> | Response;

	async connect(req: Request): Promise<Response> {
		let error = connect(req);
		if (error) return error;

		let { 0: client, 1: server } = new WebSocketPair;

		server.accept();

		function closer() {
			server.close();
		}

		server.addEventListener('close', closer);
		server.addEventListener('error', closer);

		if (this.onconnect) {
			await this.onconnect(req, server);
		}

		return new Response(null, {
			status: 101,
			statusText: 'Switching Protocols',
			webSocket: client,
		});
	}

	async fetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
		try {
			let request = new Request(input, init);
			return await this.receive(request);
		} catch (err) {
			let msg = this.DEBUG && (err as Error).stack;
			return new Response(msg || 'Error with receive', { status: 400 });
		}
	}
}

// redeclare storage param types
declare namespace Operations {
	type GET = [string | string[], Durable.Storage.Options.Get?];
	type LIST = [Durable.Storage.Options.List?];
	type DELETE = [string | string[], Durable.Storage.Options.Put?];
	type PUT =
		| [Dict<unknown>, Durable.Storage.Options.Put?]
		| [string, unknown, Durable.Storage.Options.Put?];
}

// [[durable_objects]]
// class = "DataGroup"
// name = "Animals"

// [[durable_objects]]
// class = "DataGroup"
// name = "Projects"
export class DataGroup implements Durable.Object {
	id: string;
	#storage: Durable.Storage;

	constructor(state: Durable.State) {
		this.id = state.id.toString();
		this.#storage = state.storage;
	}

	async fetch(input: Request|string, init?: RequestInit) {
		try {
			let req = new Request(input, init);
			let { pathname } = new URL(req.url);

			if (pathname === 'get') {
				let [k, o] = await req.json() as Operations.GET;
				let result = await this.#storage.get(k as string, o);

				if (result instanceof Map) {
					let results = [...result];
					return reply(200, { results });
				}

				return reply(200, { result });
			}

			if (pathname === 'list') {
				let [options] = await req.json() as Operations.LIST;
				let result = await this.#storage.list(options);

				let results = [...result];
				return reply(200, { results });
			}

			if (pathname === 'put') {
				let [k, v, o] = await req.json() as Operations.PUT;
				let isEntries = k && typeof k === 'object';

				if (isEntries) {
					o = v as Durable.Storage.Options.Put;
				}

				o = o || {};

				let { overwrite=true, ...options } = o as Durable.Storage.Options.Put & {
					overwrite?: boolean;
				};

				if (!overwrite) {
					let kk = isEntries ? Object.keys(k) : k;
					let prev = await this.#storage.get(kk as string);
					if ((prev instanceof Map && prev.size > 0) || prev != null) {
						let error = 'cannot overwrite existing key';
						return reply(409, { error });
					}
				}

				if (isEntries) {
					await this.#storage.put(k as Dict<unknown>, options);
				} else {
					await this.#storage.put(k as string, v, options);
				}

				return reply(200, { result: true });
			}

			if (pathname === 'delete') {
				let [k, o] = await req.json() as Operations.DELETE;
				let result = await this.#storage.delete(k as string, o);
				return reply(200, { result });
			}

			return reply(400);
		} catch (err) {
			let error = String(err);
			return reply(500, { error });
		}
	}
}

interface Actions {
	get: Operations.GET;
	list: Operations.LIST;
	delete: Operations.DELETE;
	put: Operations.PUT;
}

interface CacheOptions {
	cacheKey?: string;
	cacheTtl?: number;
}

export class Database implements DB {
	#ns: Durable.Namespace

	constructor(ns: Durable.Namespace) {
		this.#ns = ns;
	}

	async get(shard: string, key: string|string[], options?: Durable.Storage.Options.Get) {
		let args: Operations.GET = [key, options];

		type Options = Durable.Storage.Options.Get & CacheOptions;

		let opts: Options = options || {};
		let toCache = !opts.noCache && opts.cacheTtl;
		let cachekey = toCache && (opts.cacheKey || typeof key === 'string' && key);

		if (cachekey) {
			cachekey = this.#cachekey(shard, cachekey);
			let res = await lookup(caches.default, cachekey);
			if (res) return this.#parse(res);
		}

		let res = await this.#query(shard, 'get', args);
		if (cachekey) await caches.default.put(cachekey, res.clone());

		return this.#parse(res);
	}

	async put(shard: string, ...x: any) {
		let args = [x] as Operations.PUT;
		let res = await this.#query(shard, 'put', args);
		if (res.status !== 200) return this.#parse(res);

		type Options = Durable.Storage.Options.Put & CacheOptions;
		let options: Options = {};
		let [k, v, o] = x;

		let isDict = k && typeof k === 'object';
		if (isDict) options = v || o || {};
		else options = o || {};

		let toCache = !options.noCache && options.cacheTtl;
		let cachekey = toCache && (options.cacheKey || !isDict && (k as string));

		if (cachekey) {
			let value = isDict
				? { results: Object.entries(k) }
				: { result: v };

			let res = reply(200, value, {
				'cache-control': `public,max-age=${options.cacheTtl}`
			});

			await caches.default.put(cachekey, res);
		}

		return this.#parse(res);
	}

	async delete(shard: string, key: string | string[], options?: Durable.Storage.Options.Put) {
		let args = [key, options] as Operations.DELETE;

		let res = await this.#query(shard, 'delete', args);
		let output = await this.#parse(res);
		if (!output) return output; // 0 or false

		type Options = Durable.Storage.Options.Put & CacheOptions;
		let opts: Options = options || {};

		let toCache = !opts.noCache || !!opts.cacheKey;
		let cachekey = toCache && (opts.cacheKey || typeof key === 'string' && key);

		if (cachekey) {
			cachekey = this.#cachekey(shard, cachekey);
			await caches.default.delete(cachekey);
		}

		return output;
	}

	list(shard: string, options?: Durable.Storage.Options.List) {
		let args: Operations.LIST = [options];
		return this.#query(shard, 'list', args).then(this.#parse);
	}

	#cachekey(shard: string, key: string): string {
		let path = shard + '~' + key;
		return new URL(path, 'http://cache').href;
	}

	#query<K extends keyof Actions>(shard: string, action: K, args: Actions[K]): Promise<Response> {
		let uid = this.#ns.idFromName(shard);
		let stub = this.#ns.get(uid);

		let url = new URL(action, 'http://internal');

		// TODO retries
		return stub.fetch(url.href, {
			method: 'POST',
			body: JSON.stringify(args),
			headers: {
				'content-type': 'application/json;charset=utf-8'
			},
		});
	}

	async #parse(res: Response) {
		let body = await res.json();

		if ((res.status / 100 | 0) === 2) {
			if (body.result != null) return body.result;
			return body.results && new Map(body.results) || null;
		}

		throw new Error(body.error || 'Error executing query');
	}
}
