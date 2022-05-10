import * as Cache from './internal/cfw.cache';
import type { KV, Options, Database as DB, Entity as E } from 'worktop/cfw.kv';
import type { Promisable } from 'worktop/utils';

export function Database<Models, I extends Record<keyof Models, string> = { [P in keyof Models]: string }>(binding: KV.Namespace): DB<Models, I> {
	var $ = <K extends keyof I>(type: K, uid: I[K]) => `${type}__${uid}`;

	return {
		// @ts-ignore - dont want to redefine overloads in source
		get<K extends keyof Models>(type: K, uid: I[K], format?: Options.Read | KV.GetFormat) {
			return read<Models[K]>(binding, $(type, uid), format);
		},
		put<K extends keyof Models, M extends KV.Metadata = KV.Metadata>(type: K, uid: I[K], value: Models[K], options?: Options.Write<M>) {
			return write<Models[K]>(binding, $(type, uid), value, { toJSON: true, ...options });
		},
		del<K extends keyof Models>(type: K, uid: I[K]) {
			return remove(binding, $(type, uid));
		}
	};
}

export function read<T, M extends KV.Metadata = KV.Metadata>(binding: KV.Namespace, key: string, format: Options.Read | KV.GetFormat = 'json'): Promise<T|null> {
	// @ts-ignore - the compiler thinks "json" is only available `format` option because of unknown `T` pattern match
	return (typeof format === 'string' || !format.metadata) ? binding.get<T>(key, format) : binding.getWithMetadata<T, M>(key, format);
}

export function write<T, M extends KV.Metadata = KV.Metadata>(binding: KV.Namespace, key: string, val: T, options?: Options.Write<M>): Promise<boolean> {
	let toJSON = options && !!options.toJSON;
	let value = (!toJSON && typeof val === 'string') || val instanceof ArrayBuffer || val instanceof ReadableStream ? val : JSON.stringify(val);
	return binding.put<M>(key, value, options).then(() => true, () => false);
}

export function remove(binding: KV.Namespace, key: string): Promise<boolean> {
	return binding.delete(key).then(() => true, () => false);
}

export async function * list<M extends KV.Metadata>(
	binding: KV.Namespace,
	options?: Options.List
): AsyncGenerator<{ done: boolean; keys: KV.KeyInfo<M>[]|string[] }> {
	let { prefix, limit, cursor, metadata } = options || {};

	while (true) {
		let results = await binding.list<M>({ prefix, limit, cursor });
		cursor = results.cursor;

		yield {
			done: results.list_complete,
			keys: metadata ? results.keys : results.keys.map(x => x.name),
		};

		if (results.list_complete) return;
	}
}

export async function paginate<M extends KV.Metadata>(
	binding: KV.Namespace,
	options?: Options.Paginate
): Promise<KV.KeyInfo<M>[] | string[]> {
	let { prefix, metadata=false, limit=50, page=1 } = options || {};
	let pager = list<M>(binding, { prefix, limit, metadata });

	for await (let result of pager) {
		// page target exceeds total
		if (--page && result.done) return [];
		else if (page === 0) return result.keys;
	}

	return [];
}

export async function until<X extends string>(
	toMake: () => X,
	toSearch: (val: X) => Promise<unknown|false>
): Promise<X> {
	let exists, tmp = '' as X;
	while (true) {
		exists = await toSearch(tmp = toMake());
		if (exists == null) return tmp;
	}
}

function keyname(prefix: string, key: string): string {
	return !prefix || key.startsWith(prefix + '~') ? key : (prefix + '~' + key);
}

export class Entity<T=unknown> implements E {
	readonly ns: KV.Namespace;
	readonly cache: Cache.Entity;

	prefix = '';
	ttl = 0;

	onread?(key: string, value: T|null): Promisable<void>;
	onwrite?(key: string, value: T|null): Promisable<void>;
	ondelete?(key: string, value: T|null): Promisable<void>;

	constructor(ns: KV.Namespace) {
		this.cache = new Cache.Entity;
		this.ns = ns;
	}

	async list(options?: KV.Options.List): Promise<string[]> {
		options = options || {};
		let { limit, prefix='' } = options;

		if (this.prefix) {
			options.prefix = keyname(this.prefix, prefix);
		}

		if (limit) {
			options.limit = Math.min(1000, limit);
		}

		let iter = list(this.ns, {
			...options,
			metadata: false,
		});

		let output: string[] = [];

		for await (let chunk of iter) {
			for (let i=0, len=this.prefix.length; i < chunk.keys.length; i++) {
				output.push((chunk.keys[i] as string).substring(len));
				if (limit && output.length === limit) return output;
			}
			if (chunk.done) break;
		}

		return output;
	}

	async get(key: string): Promise<T|null> {
		key = keyname(this.prefix, key);

		let value: T|null;
		let res = this.ttl && await this.cache.get(key);

		if (res) {
			value = await res.json();
		} else {
			value = await this.ns.get<T>(key, 'json');
			if (this.ttl) await this.cache.put(key, value, this.ttl);
		}

		if (this.onread) {
			await this.onread(key, value);
		}

		return value;
	}

	async put(key: string, value: T|null): Promise<boolean> {
		key = keyname(this.prefix, key);

		let input = Cache.normalize(value);
		let bool = await this.ns.put(key, input).then(
			() => true,
			() => false
		);

		if (bool && this.ttl) {
			// allow cache to see `null` value
			let x = value == null ? null : input;
			bool = await this.cache.put(key, x, this.ttl);
		}

		if (bool && this.onwrite) {
			await this.onwrite(key, value);
		}

		return bool;
	}

	async delete(key: string): Promise<boolean> {
		key = keyname(this.prefix, key);

		let hasHook = typeof this.ondelete === 'function';
		let value = hasHook && await this.ns.get<T>(key, 'json');

		let bool = await this.ns.delete(key).then(
			() => true,
			() => false
		);

		if (bool && this.ttl) {
			bool = await this.cache.delete(key);
		}

		if (bool && hasHook) {
			await this.ondelete!(key, value as T|null);
		}

		return bool;
	}
}
