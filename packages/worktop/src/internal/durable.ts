import { reply } from 'worktop/response';
import type { Durable } from 'worktop/cfw.durable';
import type { Dict } from 'worktop/utils';

// redeclare storage param types
export namespace Operations {
	export type GET = [string | string[], Durable.Storage.Options.Get?];
	export type LIST = [Durable.Storage.Options.List?];
	export type PUT =
		| [Dict<unknown>, Durable.Storage.Options.Put?]
		| [string, unknown, Durable.Storage.Options.Put?];

	// TODO: options
	export type DELETE = [string | string[]];
}

export class Query implements Durable.Object {
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

				// @ts-ignore – TODO: types
				let { overwrite=true, ...options } = o;

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
				// TODO: options
				let [k] = await req.json() as Operations.DELETE;
				let result = await this.#storage.delete(k as string);
				return reply(200, { result });
			}

			return reply(400);
		} catch (err) {
			let error = String(err);
			return reply(500, { error });
		}
	}
}
