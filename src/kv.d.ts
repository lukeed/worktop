export namespace KV {
	type Value = string | ReadableStream | ArrayBuffer;
	type WriteOptions = { expiration?: number; expirationTtl?: number };
	type ListOptions = { prefix?: string; limit?: number; cursor?: string };
	type GetOptions = 'text' | 'json' | 'arrayBuffer' | 'stream';

	interface KeyList {
		keys: Array<{ name: string; expiration?: number }>;
		list_complete: boolean;
		cursor: string;
	}

	interface Namespace {
		get<T>(key: string, type: 'json'): Promise<T>;
		get<T>(key: string, type: 'stream'): Promise<ReadableStream>;
		get<T>(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer>;
		get<T>(key: string, type: 'text'): Promise<string>;
		get<T>(key: string, type: GetOptions): Promise<T>;
		get<T>(key: string): Promise<string>; // "text"

		put(key: string, value: Value, options?: WriteOptions): Promise<void>;
		list(options?: ListOptions): Promise<KeyList>;
		delete(key: string): Promise<void>;
	}
}

export declare class Database<Models, Identifiers extends Record<keyof Models, string> = { [P in keyof Models]: string}> {
	constructor(binding: KV.Namespace);
	get<K extends keyof Models>(type: K, uid: Identifiers[K], format?: KV.GetOptions): Promise<Models[K] | false>;
	put<K extends keyof Models>(type: K, uid: Identifiers[K], value: Models[K], toJSON?: boolean): Promise<boolean>;
	del<K extends keyof Models>(type: K, uid: Identifiers[K]): Promise<boolean>;
}

export function read<T>(binding: KV.Namespace, key: string, format?: KV.GetOptions): Promise<T | false>;
export function write<T>(binding: KV.Namespace, key: string, value: T, toJSON?: boolean): Promise<boolean>;
export function remove(binding: KV.Namespace, key: string): Promise<boolean>;

export function until<X extends string>(
	toMake: () => X,
	toSearch: (val: X) => Promise<unknown | false>
): Promise<X>;
