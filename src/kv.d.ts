export namespace KV {
	type Metadata = Record<string, any>;
	type Value = string | ReadableStream | ArrayBuffer;

	type GetFormat = 'text' | 'json' | 'arrayBuffer' | 'stream';

	type GetMetadata<T, M> = {
		value: T | null;
		metadata: M | null;
	}

	interface KeyInfo<M extends Metadata> {
		name: string;
		expiration?: number;
		metadata?: M;
	}

	interface KeyList<M extends Metadata> {
		keys: KeyInfo<M>[];
		list_complete: boolean;
		cursor?: string;
	}

	declare namespace Options {
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
	get<K extends keyof Models>(type: K, uid: Identifiers[K], format?: KV.GetFormat | KV.Options.Get): Promise<Models[K] | null>;
	put<K extends keyof Models, M extends KV.Metadata = KV.Metadata>(type: K, uid: Identifiers[K], value: Models[K], options?: Options.Write<M>): Promise<boolean>;
	del<K extends keyof Models>(type: K, uid: Identifiers[K]): Promise<boolean>;
}

// Custom method options
declare namespace Options {
	type Write<M extends KV.Metadata = KV.Metadata> = KV.Options.Put<M> & { toJSON?: boolean };
}

// Get raw item value
export function read<T extends ArrayBuffer>(binding: KV.Namespace, key: string, options: 'arrayBuffer' | KV.Options.Get<'arrayBuffer'>): Promise<T|null>;
export function read<T extends ReadableStream>(binding: KV.Namespace, key: string, options: 'stream' | KV.Options.Get<'stream'>): Promise<T|null>;
export function read<T extends string>(binding: KV.Namespace, key: string, options: 'text' | KV.Options.Get<'text'>): Promise<T|null>;
export function read<T>(binding: KV.Namespace, key: string, options?: 'json' | KV.Options.Get<'json'>): Promise<T|null>;

export function write<T, M extends KV.Metadata = KV.Metadata>(binding: KV.Namespace, key: string, value: T, options?: Options.Write<M>): Promise<boolean>;
export function remove(binding: KV.Namespace, key: string): Promise<boolean>;

export function until<X extends string>(
	toMake: () => X,
	toSearch: (val: X) => Promise<unknown | false>
): Promise<X>;
