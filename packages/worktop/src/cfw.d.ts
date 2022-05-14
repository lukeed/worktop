/// <reference lib="webworker" />

import type { Context, Initializer } from 'worktop';
import type { Promisable, Strict } from 'worktop/utils';
import type { Durable } from 'worktop/cfw.durable';
import type { WebSocket } from 'worktop/cfw.ws';
import type { KV } from 'worktop/cfw.kv';

declare global {
	const WebSocketPair: {
		new(): {
			/** the `client` socket */
			0: WebSocket,
			/** the `server` socket */
			1: WebSocket,
		};
	};

	interface CacheStorage {
		default: Cache;
	}

	interface Request {
		cf: IncomingCloudflareProperties;
	}

	interface ResponseInit {
		webSocket?: WebSocket;
	}

	interface FetchEvent {
		passThroughOnException(): void;
	}

	interface Headers {
		/* @see https://github.com/whatwg/fetch/issues/973#issuecomment-560136041 */
		getAll(name: string): string[];
	}

	function addEventListener(
		type: 'scheduled',
		handler: (event: CronEvent) => Promisable<void>
	): void;

	function queueMicrotask(task: Function): void;

	function structuredClone<T>(value: T, options?: {
		transfer?: Array<
			| ArrayBuffer
			| MessagePort
			| WritableStream
			| TransformStream
			| ReadableStream
			| OffscreenCanvas
			| ImageBitmap
		>;
	}): T;

	namespace HTMLRewriter {
		type Content = string | ReadableStream | Response;

		interface Options {
			html?: boolean;
		}

		interface Comment {
			text: string;
			readonly removed: boolean;
			replace(content: Content, options?: Options): Comment;
			before(content: Content, options?: Options): Comment;
			after(content: Content, options?: Options): Comment;
			remove(): Comment;
		}

		interface Text {
			readonly text: string;
			readonly removed: boolean;
			readonly lastInTextNode: boolean;
			replace(content: Content, options?: Options): Text;
			before(content: Content, options?: Options): Text;
			after(content: Content, options?: Options): Text;
			remove(): Text;
		}

		interface Doctype {
			readonly name: string | null;
			readonly publicId: string | null;
			readonly systemId: string | null;
		}

		interface DocumentEnd {
			append(content: Content, options?: Options): DocumentEnd;
		}

		interface Element {
			tagName: string;
			readonly attributes: IterableIterator<string[]>;
			readonly removed: boolean;
			readonly namespaceURI: string;
			hasAttribute(name: string): boolean;
			removeAttribute(name: string): Element;
			getAttribute(name: string): string | null;
			setAttribute(name: string, value: string): Element;
			replace(content: Content, options?: Options): Element;
			before(content: Content, options?: Options): Element;
			after(content: Content, options?: Options): Element;
			prepend(content: Content, options?: Options): Element;
			append(content: Content, options?: Options): Element;
			remove(): Element;
			removeAndKeepContent(): Element;
			setInnerContent(content: Content, options?: Options): Element;
			onEndTag(handler: (tag: EndTag) => Promisable<void>): void;
		}

		interface EndTag {
			name: string;
			before(content: Content, options?: Options): EndTag;
			after(content: Content, options?: Options): EndTag;
			remove(): EndTag;
		}

		interface Handlers {
			element?(element: Element): Promisable<void>;
			comments?(comment: Comment): Promisable<void>;
			text?(text: Text): Promisable<void>;
		}

		interface DocumentHandlers extends Handlers {
			doctype?(doctype: Doctype): Promisable<void>;
			comments?(comment: Comment): Promisable<void>;
			text?(text: Text): Promisable<void>;
			end?(end: DocumentEnd): Promisable<void>;
		}
	}

	class HTMLRewriter {
		on(selector: string, handlers: HTMLRewriter.Handlers): HTMLRewriter;
		onDocument(handlers: HTMLRewriter.DocumentHandlers): HTMLRewriter;
		transform(response: Response): Response;
	}
}

export interface Bindings {
	[name: string]: string | CryptoKey | KV.Namespace | Durable.Namespace | Module.Service;
}

export type FetchHandler<B extends Bindings = Bindings> = (
	request: Request,
	bindings: Strict<B>,
	context: {
		bindings?: Bindings;
		waitUntil(f: any): void;
		passThroughOnException(): void;
	}
) => Promisable<Response>;

export type CronHandler<B extends Bindings = Bindings> = (
	event: Omit<CronEvent, 'waitUntil'>,
	bindings: Strict<B>,
	context: {
		bindings?: Bindings;
		waitUntil(f: any): void;
	}
) => Promisable<void>;

export interface CronEvent {
	type: 'scheduled';
	/**
	 * The CRON trigger
	 * @example "23 59 LW * *"
	 */
	cron: string;
	/**
	 * Milliseconds since UNIX epoch.
	 * @example new Date(evt.scheduledTime)
	 */
	scheduledTime: number;
	/**
	 * Method wrapper for event's action handler.
	 */
	waitUntil(f: Promisable<any>): void;
}

/**
 * Cloudflare Request Metadata/Properties
 * @see https://developers.cloudflare.com/workers/runtime-apis/request#incomingrequestcfproperties
 * @see https://github.com/cloudflare/workers-types/blob/master/overrides/cf.d.ts
 */
export interface IncomingCloudflareProperties {
	/**
	 * The ASN of the incoming request
	 * @example 395747
	 **/
	asn: number;
	/**
	 * The organisation which owns the ASN of the incoming request.
	 * @example "Google Cloud"
	 */
	asOrganization: string;
	botManagement?: {
		score: number;
		staticResource: boolean;
		verifiedBot: boolean;
	};
	/**
	 * Round-trip time (in ms) from client to the colo data center that the request hit
	 */
	clientTcpRtt: number;
	clientTrustScore?: number;
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

export namespace Module {
	export interface Service {
		fetch: typeof fetch;
	}

	export interface Worker<B extends Bindings = Bindings> {
		fetch?: FetchHandler<B>;
		scheduled?: CronHandler<B>;
	}

	export interface Context {
		bindings?: Bindings;
		waitUntil(f: any): void;
		passThroughOnException?(): void;
	}
}

/**
 * Tiny helper for easy TypeScript definition inferences
 */
export function define<
	B extends Bindings = Bindings
>(worker: Module.Worker<B>): Module.Worker<B>;

/**
 * Generate a Module Worker definition from a Module `Initializer` function.
 * @example export default cfw.start(API.run);
 */
export function start<
	C extends Context = Context,
	B extends Bindings = Bindings,
>(run: Initializer<C>): {
	fetch: FetchHandler<B>;
}

/**
 * Attach the `Initializer` function as a "fetch" event listener.
 * @note This is the same as `start` from `worktop/sw` but auto-loads
 * the type definitions for the Cloudflare runtime environment.
 * @example cfw.listen(API.run);
 */
export function listen<
	C extends Context = Context
>(run: Initializer<C>): void;
