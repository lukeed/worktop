import type { KV, Database as DB } from 'worktop/kv';

export function Database<M, I extends Record<keyof M, string> = { [P in keyof M]: string }>(binding: KV.Namespace): DB<M, I> {
	var $ = <K extends keyof I>(type: K, uid: I[K]) => `${type}__${uid}`;

	return {
		get<K extends keyof M>(type: K, uid: I[K], format?: KV.GetOptions) {
			return read<M[K]>(binding, $(type, uid), format);
		},
		put<K extends keyof M>(type: K, uid: I[K], value: M[K], toJSON = true) {
			return write<M[K]>(binding, $(type, uid), value, toJSON);
		},
		del<K extends keyof M>(type: K, uid: I[K]) {
			return remove(binding, $(type, uid));
		}
	};
}

export function read<T>(binding: KV.Namespace, key: string, format: KV.GetOptions = 'json'): Promise<T | false> {
	return binding.get<T>(key, format).then(x => x !== void 0 ? x : false);
}

export function write<T=any>(binding: KV.Namespace, key: string, value: T, toJSON?: boolean): Promise<boolean> {
	return binding.put(key, (!toJSON && (typeof value === 'string' || value instanceof ArrayBuffer || value instanceof ReadableStream)) ? value : JSON.stringify(value)).then(() => true, () => false);
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
