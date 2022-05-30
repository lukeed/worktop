import type { Dict, Strict } from 'worktop/utils';
import type { Context, Params } from 'worktop';
import type { Module } from 'worktop/cfw';

export namespace R2 {
	interface Conditional {
		etagMatches?: string;
		etagDoesNotMatch?: string;
		uploadedBefore?: Date;
		uploadedAfter?: Date;
	}

	type Range =
		| { offset: number; length?: number }
		| { offset?: number; length: number }
		| { suffix: number };

	type Value =
		| ReadableStream
		| ArrayBuffer
		| ArrayBufferView
		| Blob
		| string
		| null;

	namespace Options {
		interface Get {
			onlyIf?: R2.Conditional | Headers;
			range?: R2.Range;
		}
		interface List {
			limit?: number;
			prefix?: string;
			cursor?: string;
			delimiter?: string;
			include?: ("httpMetadata" | "customMetadata")[];
		}
		interface Put<M extends R2.Metadata.Custom = R2.Metadata.Custom> {
			md5?: ArrayBuffer | string;
			httpMetadata?: R2.Metadata.HTTP | Headers;
			customMetadata?: M;
		}
	}

	interface Bucket {
		get<M extends R2.Metadata.Custom>(key: string): Promise<R2.Object<M> | null>;
		get<M extends R2.Metadata.Custom>(key: string, options: R2.Options.Get): Promise<R2.Object<M> | R2.Object.Metadata<M> | null>;
		get<M extends R2.Metadata.Custom>(key: string, options?: R2.Options.Get): Promise<R2.Object<M> | R2.Object.Metadata<M> | null>;

		head<M extends R2.Metadata.Custom>(key: string): Promise<R2.Object.Metadata<M> | null>;
		list<M extends R2.Metadata.Custom>(options?: R2.Options.List): Promise<R2.Object.List<M>>;
		put<M extends R2.Metadata.Custom>(key: string, value: R2.Value, options?: R2.Options.Put<M>): Promise<R2.Object.Metadata<M>>;
		delete(key: string): Promise<void>;
	}

	namespace Metadata {
		type Custom = Dict<string>;

		interface HTTP {
			contentType?: string;
			contentLanguage?: string;
			contentDisposition?: string;
			contentEncoding?: string;
			cacheControl?: string;
			cacheExpiry?: Date;
		}
	}

	namespace Object {
		interface Metadata<M extends R2.Metadata.Custom = R2.Metadata.Custom> {
			readonly key: string;
			readonly version: string;
			readonly size: number;
			readonly etag: string;
			readonly httpEtag: string;
			readonly uploaded: Date;
			readonly customMetadata: M;
			readonly httpMetadata: R2.Metadata.HTTP;
			writeHttpMetadata(headers: Headers): void;
		}

		interface List<M extends R2.Metadata.Custom = R2.Metadata.Custom> {
			objects: R2.Object.Metadata<M>[];
			delimitedPrefixes: string[];
			truncated: boolean;
			cursor?: string;
		}
	}

	/**
	 * The metadata for the object and the body of the payload.
	 */
	interface Object<M extends R2.Metadata.Custom = R2.Metadata.Custom> extends R2.Object.Metadata<M> {
		readonly body: ReadableStream;
		readonly bodyUsed: boolean;
		arrayBuffer(): Promise<ArrayBuffer>;
		text(): Promise<string>;
		json<T>(): Promise<T>;
		blob(): Promise<Blob>;
	}
}

// options for custom methods
export namespace Options {
	type Paginate = R2.Options.List & {
		page?: number;
	};

	type Sync = {
		/**
		 * The R2 bucket binding.
		 */
		bucket: R2.Bucket | ((context: Module.Context) => R2.Bucket);
		/**
		 * Integrate the Cache API with R2 responses.
		 * @example
		 *  `false` => disables Cache usage
		 *  `true` => use Cache with default settings
		 *  `{ ... }` => use Cache with custom settings
		 * @default true
		 */
		cache?: boolean | {
			/**
			 * The `Cache` for persistence.
			 * @default caches.default
			 */
			storage?: Cache | (() => Promise<Cache>);
			/**
			 * Determine the `Cache-Control` value.
			 * Strings are accepted as is; numbers treated as `max-age` seconds.
			 * @note A `0` value will not cache.
			 * @example
			 * 	86400 => "public,max-age=86400"
			 * 	"private,max-age=900" => "private,max-age=900"
			 * @default "public,max-age=3600"
			 */
			lifetime?: string | number | ((request: Request) => number|string);
			/**
			 * Customize the cache key for `Cache` lookup & persistence.
			 * @default `r2://${encodeURIComponent(new URL(request.url).pathname)}`
			 */
			key?(request: Request): string;
		};
	}
}

export function list<M extends R2.Metadata.Custom>(
	bucket: R2.Bucket,
	options?: R2.Options.List
): AsyncGenerator<{
	objects: R2.Object.Metadata<M>[]
	done: boolean;
}>;

export function paginate<M extends R2.Metadata.Custom>(
	bucket: R2.Bucket,
	options?: Options.Paginate
): Promise<R2.Object.Metadata<M>[]>;

export function serve(
	bucket: R2.Bucket,
	request: Request | `/${string}`
): Promise<Response>;

export function sync(options: Options.Sync): <
	C extends Context = Context,
	P extends Params = Params,
>(
	request: Request,
	context: Omit<C, 'params'> & {
		params: Strict<P & C['params']>;
	}
) => Promise<Response | void>;
