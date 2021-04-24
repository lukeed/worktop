/// <reference lib="webworker" />

declare global {
	interface Request {
		cf: IncomingCloudflareProperties;
	}
}

export type Params = Record<string, string>;

/** @see {require('http').METHODS} */
export type Method = 'ACL' | 'BIND' | 'CHECKOUT' | 'CONNECT' | 'COPY' | 'DELETE' | 'GET' | 'HEAD' | 'LINK' | 'LOCK' | 'M-SEARCH' | 'MERGE' | 'MKACTIVITY' | 'MKCALENDAR' | 'MKCOL' | 'MOVE' | 'NOTIFY' | 'OPTIONS' | 'PATCH' | 'POST' | 'PRI' | 'PROPFIND' | 'PROPPATCH' | 'PURGE' | 'PUT' | 'REBIND' | 'REPORT' | 'SEARCH' | 'SOURCE' | 'SUBSCRIBE' | 'TRACE' | 'UNBIND' | 'UNLINK' | 'UNLOCK' | 'UNSUBSCRIBE';

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
	requestPriority?: string;
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
	 * @example "Austin"
	 **/
	city?: string;
	/**
	 * Continent of the incoming request
	 * @example "NA"
	 **/
	continent?: string;
	/**
	 * Latitude of the incoming request
	 * @example "30.27130"
	 **/
	latitude?: string;
	/**
	 * Longitude of the incoming request
	 * @example "-97.74260"
	 **/
	longitude?: string;
	/**
	 * Postal code of the incoming request
	 * @example "78701"
	 **/
	postalCode?: string;
	/**
	 * Metro code (DMA) of the incoming request
	 * @example "635"
	 **/
	metroCode?: string;
	/**
	 * If known, the `ISO 3166-2` name for the first level region associated with the IP address of the incoming request
	 * @example "Texas"
	 **/
	region?: string;
	/**
	 * If known, the `ISO 3166-2` code for the first level region associated with the IP address of the incoming request
	 * @example "TX"
	 **/
	regionCode?: string;
	/**
	 * Timezone of the incoming request
	 * @example "America/Chicago".
	 **/
	timezone: string;
}

export declare class ServerRequest<P extends Params = Params> {
	constructor(event: FetchEvent);
	url: string;
	path: string;
	method: Method;
	origin: string;
	hostname: string;
	search: string;
	query: URLSearchParams;
	extend: FetchEvent['waitUntil'];
	cf: IncomingCloudflareProperties;
	headers: Headers;
	params: P;
	body: {
		<T>(): Promise<T|void>;
		json<T=any>(): Promise<T>;
		arrayBuffer(): Promise<ArrayBuffer>;
		formData(): Promise<FormData>;
		text(): Promise<string>;
		blob(): Promise<Blob>;
	};
}
