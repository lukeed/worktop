import type { Dict, Promisable } from 'worktop/utils';

export namespace KV {
	type Metadata = Dict<any>;
	type Value = string | ReadableStream | ArrayBuffer;

	type GetFormat = 'text' | 'json' | 'arrayBuffer' | 'stream';

	type GetMetadata<T, M extends Metadata = Metadata> = {
		value: T | null;
		metadata: M | null;
	}

	interface KeyInfo<M extends Metadata = Metadata> {
		name: string;
		expiration?: number;
		metadata?: M;
	}

	interface KeyList<M extends Metadata = Metadata> {
		keys: KeyInfo<M>[];
		list_complete: boolean;
		cursor?: string;
	}

	namespace Options {
		type List = {
			prefix?: string;
			cursor?: string;
			limit?: number;
		}

		type Get<T extends GetFormat = GetFormat> = {
			type: T;
			cacheTtl?: number;
		}

		type Put<M extends Metadata = Metadata> = {
			expiration?: number;
			expirationTtl?: number;
			metadata?: M;
		}
	}

	interface Namespace {
		get<T>(key: string, options: 'json' | Options.Get<'json'>): Promise<T|null>;
		get<T extends ReadableStream>(key: string, options: 'stream' | Options.Get<'stream'>): Promise<T|null>;
		get<T extends ArrayBuffer>(key: string, options: 'arrayBuffer' | Options.Get<'arrayBuffer'>): Promise<T|null>;
		get<T extends string>(key: string, options?: 'text' | Options.Get<'text'>): Promise<T|null>;

		getWithMetadata<T, M extends Metadata>(key: string, options: 'json' | Options.Get<'json'>): Promise<GetMetadata<T, M>>;
		getWithMetadata<T extends ReadableStream, M extends Metadata>(key: string, options: 'stream' | Options.Get<'stream'>): Promise<GetMetadata<T, M>>;
		getWithMetadata<T extends ArrayBuffer, M extends Metadata>(key: string, options: 'arrayBuffer' | Options.Get<'arrayBuffer'>): Promise<GetMetadata<T, M>>;
		getWithMetadata<T extends string, M extends Metadata>(key: string, options?: 'text' | Options.Get<'text'>): Promise<GetMetadata<T, M>>;

		put<M extends Metadata>(key: string, value: Value, options?: Options.Put<M>): Promise<void>;
		list<M extends Metadata>(options?: Options.List): Promise<KeyList<M>>;
		delete(key: string): Promise<void>;
	}
}

export declare class Database<Models, Identifiers extends Record<keyof Models, string> = { [P in keyof Models]: string}> {
	constructor(binding: KV.Namespace);
	get<K extends keyof Models>(type: K, uid: Identifiers[K], options: Options.Read & { metadata: true }): Promise<KV.GetMetadata<Models[K]>>;
	get<K extends keyof Models>(type: K, uid: Identifiers[K], options?: KV.GetFormat | (Options.Read & { metadata?: false })): Promise<Models[K] | null>;

	put<K extends keyof Models>(type: K, uid: Identifiers[K], value: Models[K], options?: Options.Write): Promise<boolean>;
	del<K extends keyof Models>(type: K, uid: Identifiers[K]): Promise<boolean>;
}

// Custom method options
export namespace Options {
	type Read<T extends KV.GetFormat = KV.GetFormat> = KV.Options.Get<T> & { metadata?: boolean };
	type Write<M extends KV.Metadata = KV.Metadata> = KV.Options.Put<M> & { toJSON?: boolean };
	type List = KV.Options.List & { metadata?: boolean };
	type Paginate = {
		page?: number;
		limit?: number;
		prefix?: string;
		metadata?: boolean;
	}
}

// Get item value with metadata
export function read<T extends ArrayBuffer, M extends KV.Metadata = KV.Metadata>(binding: KV.Namespace, key: string, options: Options.Read<'arrayBuffer'> & { metadata: true }): Promise<KV.GetMetadata<T, M>>;
export function read<T extends ReadableStream, M extends KV.Metadata = KV.Metadata>(binding: KV.Namespace, key: string, options: Options.Read<'stream'> & { metadata: true }): Promise<KV.GetMetadata<T, M>>;
export function read<T extends string, M extends KV.Metadata = KV.Metadata>(binding: KV.Namespace, key: string, options: Options.Read<'text'> & { metadata: true }): Promise<KV.GetMetadata<T, M>>;
export function read<T, M extends KV.Metadata = KV.Metadata>(binding: KV.Namespace, key: string, options: Options.Read<'json'> & { metadata: true }): Promise<KV.GetMetadata<T, M>>;

// Get raw item value (no metadata)
export function read<T extends ArrayBuffer>(binding: KV.Namespace, key: string, options: 'arrayBuffer' | Options.Read<'arrayBuffer'>): Promise<T|null>;
export function read<T extends ReadableStream>(binding: KV.Namespace, key: string, options: 'stream' | Options.Read<'stream'>): Promise<T|null>;
export function read<T extends string>(binding: KV.Namespace, key: string, options: 'text' | Options.Read<'text'>): Promise<T|null>;
export function read<T>(binding: KV.Namespace, key: string, options?: 'json' | Options.Read<'json'>): Promise<T|null>;

export function write<T, M extends KV.Metadata = KV.Metadata>(binding: KV.Namespace, key: string, value: T, options?: Options.Write<M>): Promise<boolean>;
export function remove(binding: KV.Namespace, key: string): Promise<boolean>;

export function list<M extends KV.Metadata>(binding: KV.Namespace, options?: Options.List & { metadata: true }): AsyncGenerator<{ done: boolean; keys: KV.KeyInfo<M>[] }>;
export function list<M extends KV.Metadata>(binding: KV.Namespace, options?: Options.List): AsyncGenerator<{ done: boolean; keys: string[] }>;

export function paginate<M extends KV.Metadata>(binding: KV.Namespace, options?: Options.Paginate & { metadata: true }): Promise<KV.KeyInfo<M>[]>;
export function paginate<M extends KV.Metadata>(binding: KV.Namespace, options?: Options.Paginate & { metadata?: false }): Promise<string[]>;

export function until<X extends string>(
	toMake: () => X,
	toSearch: (val: X) => Promise<unknown | false>
): Promise<X>;

export declare class Entity<Data=unknown> {
	/**
	 * The KV Namespace for this entity.
	 */
	readonly ns: KV.Namespace;

	/**
	 * Cache.Entity operations
	 */
	readonly cache: {
		get(key: string): Promise<Response|void>;
		put(key: string, value: Data|null, ttl: number): Promise<boolean>;
		delete(key: string): Promise<boolean>;
	};

	/**
	 * cache ttl (seconds)
	 * @default 0
	 */
	ttl?: number;

	/**
	 * key prefix
	 * @default ""
	 */
	prefix?: string;

	constructor(binding: KV.Namespace);

	onread?(key: string, value: Data|null): Promisable<void>;
	onwrite?(key: string, value: Data|null): Promisable<void>;
	ondelete?(key: string, value: Data|null): Promisable<void>;

	get(key: string): Promise<Data|null>;
	list(options?: KV.Options.List): Promise<string[]>;
	put(key: string, value: Data|null): Promise<boolean>;
	delete(key: string): Promise<boolean>;
}
