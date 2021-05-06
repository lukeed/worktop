import type { KV, Options, Database as DB } from 'worktop/kv';

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
