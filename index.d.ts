/// <reference lib="webworker" />

type Promisable<T> = Promise<T> | T;

// worktop/router
export type Route = { params: Params; handler: Handler | false };
export type Handler = (req: ServerRequest, res: ServerResponse) => Promisable<Response|void>;
export type Params = Record<string, string>;
export declare class Router {
	add(method: string, route: RegExp | string, handler: Handler): void;
	find(method: string, pathname: string): Route;
	run(event: FetchEvent): Promise<Response>;
	listen(event: FetchEvent): void;
	onerror(req: Omit<ServerRequest, 'params'>, res: ServerResponse, status?: number, error?: Error): Promisable<Response>;
	prepare?(req: Omit<ServerRequest, 'params'>, res: ServerResponse): Promisable<void>;
}

// TODO?: worktop/status | worktop/errors
export declare var STATUS_CODES : Record<string|number, string>;

/** @see https://developers.cloudflare.com/workers/runtime-apis/request#incomingrequestcfproperties */
export interface IncomingCloudflareProperties {
	/**
	 * The ASN of the incoming request
	 * @example "395747"
	 **/
	asn: string;
	/**
	 * The three-letter `IATA` airport code of the data center that the request hit
	 * @example "DFW"
	 */
	colo: string;
	/**
	 * The two-letter country code in the request.
	 * @note This is the same value as that provided in the `CF-IPCountry` header
	 * @example "US"
	 */
	country: string | null;
	/**
	 * The HTTP Protocol
	 * @example "HTTP/2"
	 */
	httpProtocol: string;
	/**
	 * The browser-requested prioritization information in the request object
	 * @example "weight=192;exclusive=0;group=3;group-weight=127"
	 */
	requestPriority: string | null;
	/**
	 * The cipher for the connection to Cloudflare
	 * @example "AEAD-AES128-GCM-SHA256"
	 */
	tlsCipher: string;
	/**
	 * @note Requires Cloudflare Access or API Shield
	 */
	tlsClientAuth?: {
		certIssuerDN: string;
		certIssuerDNLegacy: string;
		certPresented: '0' | '1';
		certSubjectDNLegacy: string;
		certSubjectDN: string;
		/** @example "Dec 22 19:39:00 2018 GMT" */
		certNotBefore: string;
		/** @example "Dec 22 19:39:00 2018 GMT" */
		certNotAfter: string;
		certFingerprintSHA1: string;
		certSerial: string;
		/** @example "SUCCESS", "FAILED:reason", "NONE" */
		certVerified: string;
	};
	/**
	 * The TLS version of the connection to Cloudflare
	 * @example "TLSv1.3"
	 */
	tlsVersion: string;
	/**
	 * City of the incoming request
	 * @note Requires Business of Enterprise plan
	 * @example "Austin"
	 **/
	city?: string;
	/**
	 * Continent of the incoming request
	 * @note Requires Business of Enterprise plan
	 * @example "NA"
	 **/
	continent?: string;
	/**
	 * Latitude of the incoming request
	 * @note Requires Business of Enterprise plan
	 * @example "30.27130"
	 **/
	latitude?: string;
	/**
	 * Longitude of the incoming request
	 * @note Requires Business of Enterprise plan
	 * @example "-97.74260"
	 **/
	longitude?: string;
	/**
	 * Postal code of the incoming request
	 * @note Requires Business of Enterprise plan
	 * @example "78701"
	 **/
	postalCode?: string | null;
	/**
	 * Metro code (DMA) of the incoming request
	 * @note Requires Business of Enterprise plan
	 * @example "635"
	 **/
	metroCode?: string | null;
	/**
	 * If known, the `ISO 3166-2` name for the first level region associated with the IP address of the incoming request
	 * @note Requires Business of Enterprise plan
	 * @example "Texas"
	 **/
	region?: string | null;
	/**
	 * If known, the `ISO 3166-2` code for the first level region associated with the IP address of the incoming request
	 * @note Requires Business of Enterprise plan
	 * @example "TX"
	 **/
	regionCode?: string | null;
	/**
	 * Timezone of the incoming request
	 * @note Requires Business of Enterprise plan
	 * @example "America/Chicago".
	 **/
	timezone?: string;
}

declare global {
	function addEventListener(type: 'fetch', handler: FetchHandler): void;

	interface Request {
		cf: IncomingCloudflareProperties;
	}
}

// worktop/request
export interface ServerRequest {
	url: string;
	path: string;
	method: string;
	hostname: string;
	params: Params;
	search: string;
	query: URLSearchParams;
	extend: FetchEvent['waitUntil'];
	cf: IncomingCloudflareProperties;
	headers: Headers;
	body: {
		<T>(): Promise<T|void>;
		json<T=any>(): Promise<T>;
		arrayBuffer(): Promise<ArrayBuffer>;
		formData(): Promise<FormData>;
		text(): Promise<string>;
		blob(): Promise<Blob>;
	};
}
