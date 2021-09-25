import type { Context, Params } from 'worktop';
import type { Strict } from 'worktop/utils';

export interface Config {
	/**
	 * The specific origin to allow.
	 * Sets the `Access-Control-Allow-Origin` header.
	 * @default "*" – Allows all origins by default.
	 * @example "https://example.com"
	 */
	origin: string;
	/**
	 * The duration (in seconds) that a preflight results can be cached.
	 * Sets the `Access-Control-Max-Age` header.
	 * @example 3600 – Caches for 1 hour
	 */
	maxage?: number;
	/**
	 * The methods allowed when accessing the resource
	 * Sets the `Access-Control-Allow-Methods` header.
	 * @default ['GET','HEAD','PUT','PATCH','POST','DELETE']
	 */
	methods?: string[];
	/**
	 * Whether or not the actual request can be made using credentials.
	 * Sets the `Access-Control-Allow-Credentials` header.
	 * @default false
	 */
	credentials?: boolean;
	/**
	 * The HTTP headers that can be used when making the actual request.
	 * Sets the `Access-Control-Allow-Headers` header.
	 * @default request.headers.get('Access-Control-Request-Headers') || []
	 */
	headers?: string[];
	/**
	 * The HTTP response header names that a client is allowed to access.
	 * Sets the `Access-Control-Expose-Headers` header.
	 * @default []
	 */
	expose?: string[];
}

/**
 * The defaults used for CORS construction.
 */
export const config: Config;

/**
 * Apply CORS headers.
 * Conditionallyy sets headers for preflight (aka OPTIONS) requests.
 * @NOTE Values in `options` are given priority, otherwise the `config` defaults are used.
 */
export function headers(res: Response, options?: Partial<Config>): Config;

type PreflightConfig = Omit<Config, 'origin'> & {
	/**
	 * When a string, only requests from the specified value are allowed.
	 * When `true`, the incoming `Origin` header will always be allowed.
	 * When a RegExp, matching `Origin` header values will be allowed.
	 * When `false`, allows any origin – equivalent to `"*"` value.
	 * @default "*"
	 */
	origin?: string | boolean | RegExp;
}

/**
 * Apply all CORS headers (see `headers` export)
 * Will also handle preflight (aka, OPTIONS) requests.
 */
export function preflight(options?: PreflightConfig): <
	C extends Context = Context,
	P extends Params = Params,
>(
	request: Request,
	context: Omit<C, 'params'> & {
		params: Strict<P & C['params']>;
	}
) => Response | void;
