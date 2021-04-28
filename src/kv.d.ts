export namespace KV {
	type Value = string | ReadableStream | ArrayBuffer;
	type WriteOptions = { expiration?: number; expirationTtl?: number };
	type ListOptions = { prefix?: string; limit?: number; cursor?: string };

	type GetFormat = 'text' | 'json' | 'arrayBuffer' | 'stream';
	type GetOptions<T> = { type: T; cacheTtl?: number };

	interface KeyList {
		keys: Array<{ name: string; expiration?: number }>;
		list_complete: boolean;
		cursor: string;
	}

	interface Namespace {
		get<T>(key: string, type: 'json'): Promise<T|null>;
		get<T>(key: string, options: GetOptions<'json'>): Promise<T|null>;

		get<T>(key: string, type: 'stream'): Promise<ReadableStream|null>;
		get<T>(key: string, options: GetOptions<'stream'>): Promise<ReadableStream|null>;

		get<T>(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer|null>;
		get<T>(key: string, options: GetOptions<'arrayBuffer'>): Promise<ArrayBuffer|null>;

		get<T>(key: string, type: 'text'): Promise<string|null>;
		get<T>(key: string, options: GetOptions<'text'>): Promise<string|null>;

		get<T>(key: string, type?: GetFormat): Promise<string|null>; // "text"
		get<T>(key: string, options?: GetOptions<GetFormat> ): Promise<string|null>; // "text"




		put(key: string, value: Value, options?: WriteOptions): Promise<void>;
		list(options?: ListOptions): Promise<KeyList>;
		delete(key: string): Promise<void>;
	}
}

export declare class Database<Models, Identifiers extends Record<keyof Models, string> = { [P in keyof Models]: string}> {
	constructor(binding: KV.Namespace);
	get<K extends keyof Models>(type: K, uid: Identifiers[K], format?: KV.GetFormat): Promise<Models[K] | false>;
	put<K extends keyof Models>(type: K, uid: Identifiers[K], value: Models[K], toJSON?: boolean, options?: KV.WriteOptions): Promise<boolean>;
	del<K extends keyof Models>(type: K, uid: Identifiers[K]): Promise<boolean>;
}

export function read<T>(key: string, type: 'json'): Promise<T|false>;
export function read<T>(key: string, options: KV.GetOptions<'json'>): Promise<T|false>;

export function read<T extends ReadableStream>(key: string, type: 'stream'): Promise<T|false>;
export function read<T extends ReadableStream>(key: string, options: KV.GetOptions<'stream'>): Promise<T|false>;

export function read(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer|false>;
export function read(key: string, options: KV.GetOptions<'arrayBuffer'>): Promise<ArrayBuffer|false>;

export function read<T extends string>(key: string, type: 'text'): Promise<T|false>;
export function read<T extends string>(key: string, options: KV.GetOptions<'text'>): Promise<T|false>;

export function read<T extends string>(binding: KV.Namespace, key: string, format?: KV.GetFormat): Promise<T | false>;
export function read<T extends string>(binding: KV.Namespace, key: string, options?: KV.GetOptions<KV.GetFormat>): Promise<T | false>;

export function write<T>(binding: KV.Namespace, key: string, value: T, toJSON?: boolean, options?: KV.WriteOptions): Promise<boolean>;
export function remove(binding: KV.Namespace, key: string): Promise<boolean>;

export function until<X extends string>(
	toMake: () => X,
	toSearch: (val: X) => Promise<unknown | false>
): Promise<X>;
