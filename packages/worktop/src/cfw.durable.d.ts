import type { Bindings } from 'worktop/cfw';
import type { WebSocket } from 'worktop/cfw.ws';
import type { Dict, Promisable } from 'worktop/utils';

export namespace Durable {
	export interface Namespace {
		get(id: ObjectID): Object;
		idFromName(name: string): ObjectID;
		idFromString(hex: string): ObjectID;
		newUniqueId(options?: {
			jurisdiction: 'eu';
		}): ObjectID;
	}

	export interface ObjectID {
		name?: string;
		toString(): string;
	}

	export interface Object {
		id: ObjectID;
		fetch: typeof fetch;
		name?: string;
	}

	export interface State {
		id: ObjectID;
		storage: Storage;
		waitUntil(f: any): void;
		blockConcurrencyWhile<T>(f: () => Promisable<T>): Promise<T>;
	}

	export namespace Storage {
		export namespace Options {
			export interface Get {
				/** Bypass in-memory cache management */
				noCache?: boolean;
				/** Opt out of race-condition protections */
				allowConcurrency?: boolean;
			}

			export interface Put {
				/** Bypass in-memory cache management */
				noCache?: boolean;
				/** Do not wait for disk flush */
				allowUnconfirmed?: boolean;
			}

			export interface List extends Options.Get {
				/** begin listing results from this key, inclusive */
				start?: string;
				/** stop listing results at this key, exclusive */
				end?: string;
				/** only include results if key begins with prefix */
				prefix?: string;
				/** if true, results given in descending lexicographic order */
				reverse?: boolean;
				/** maximum number of results to return */
				limit?: number;
			}
		}
	}

	export interface Storage {
		get<T>(key: string, options?: Storage.Options.Get): Promise<T | void>;
		get<T>(keys: string[], options?: Storage.Options.Get): Promise<Map<string, T>>;

		put<T>(entries: Dict<T>, options?: Storage.Options.Put): Promise<void>;
		put<T>(key: string, value: T, options?: Storage.Options.Put): Promise<void>;

		delete(key: string, options?: Storage.Options.Put): Promise<boolean>;
		delete(keys: string[], options?: Storage.Options.Put): Promise<number>;
		deleteAll(options?: Storage.Options.Put): Promise<void>;

		list<T>(options?: Storage.Options.List): Promise<Map<string, T>>;
	}
}

export abstract class Actor {
	public DEBUG: boolean;
	constructor(state: Durable.State, bindings: Bindings);
	setup?(state: Durable.State, bindings: Bindings): Promise<void> | void;

	abstract receive(req: Request): Promise<Response> | Response;
	fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;

	onconnect?(req: Request, ws: WebSocket): Promise<void> | void;
	connect(req: Request): Promise<Response>;
}

export const DataGroup: Durable.Object;

// @private
// type CacheOptions = {
// 	/** seconds */
// 	cacheTtl?: number;
// 	/** custom cache identifier; ideal for multi-key scenarios */
// 	cacheKey?: string;
// };

// export class Database {
// 	constructor(namespace: Durable.Namespace);

// 	get<T>(shard: string, key: string, options?: Durable.Storage.Options.Get & CacheOptions): Promise<T|void>;
// 	get<T>(shard: string, keys: string[], options?: Durable.Storage.Options.Get & CacheOptions): Promise<Map<string, T>>;

// 	put<T>(shard: string, entries: Dict<T>, options?: { overwrite?: boolean } & Durable.Storage.Options.Put & CacheOptions): Promise<boolean>;
// 	put<T>(shard: string, key: string, value: T, options?: { overwrite?: boolean } & Durable.Storage.Options.Put & CacheOptions): Promise<boolean>;

// 	delete(shard: string, key: string, options?: Durable.Storage.Options.Put & CacheOptions): Promise<boolean>;
// 	delete(shard: string, key: string[], options?: Durable.Storage.Options.Put & CacheOptions): Promise<number>;

// 	list<T>(shard: string, options?: Durable.Storage.Options.List): Promise<Map<string, T>>;
// }
