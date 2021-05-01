import type { KV, Options, Database as DB } from 'worktop/kv';

export function Database<Models, I extends Record<keyof Models, string> = { [P in keyof Models]: string }>(binding: KV.Namespace): DB<Models, I> {
	var $ = <K extends keyof I>(type: K, uid: I[K]) => `${type}__${uid}`;

	return {
		get<K extends keyof Models>(type: K, uid: I[K], format?: KV.Options.Get | KV.GetFormat) {
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

export function read<T>(binding: KV.Namespace, key: string, format: KV.Options.Get | KV.GetFormat = 'json'): Promise<T|false> {
	// @ts-ignore - T + generic `format` pattern match
	return binding.get<T>(key, format).then(x => x != null ? x : false);
}

export function write<T, M extends KV.Metadata = KV.Metadata>(binding: KV.Namespace, key: string, val: T, options?: Options.Write<M>): Promise<boolean> {
	let toJSON = options && !!options.toJSON;
	let value = (!toJSON && typeof val === 'string') || val instanceof ArrayBuffer || val instanceof ReadableStream ? val : JSON.stringify(val);
	return binding.put<M>(key, value, options).then(() => true, () => false);
}

export function remove(binding: KV.Namespace, key: string): Promise<boolean> {
	return binding.delete(key).then(() => true, () => false);
}

export async function until<X extends string>(
	toMake: () => X,
	toSearch: (val: X) => Promise<unknown | false>
): Promise<X> {
	let exists, tmp = '' as X;
	while (exists !== false) {
		exists = await toSearch(tmp = toMake());
	}
	return tmp;
}
