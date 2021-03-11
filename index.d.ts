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

// worktop/request
export interface ServerRequest {
	url: string;
	method: string;
	path: string;
	hostname: string;
	params: Params;
	query: URLSearchParams;
	search: string;
	headers: Headers;
	body<T>(): Promise<T>;
	extend: FetchEvent['waitUntil'];
}

// worktop/response
export type FetchHandler = (event: FetchEvent) => void;
export type ResponseHandler = (event: FetchEvent) => Promise<Response> | Response;
export function reply(handler: ResponseHandler): FetchHandler;

type HeadersObject = Record<string, string>;
export declare class ServerResponse {
	constructor(method: string);
	readonly finished: boolean;

	headers: Headers;
	body: BodyInit | null;

	statusCode: number;
	get status(): number;
	set status(x: number);

	getHeaders(): HeadersObject;
	getHeaderNames(): string[];

	hasHeader(key: string): boolean;
	getHeader(key: string): string | null;
	setHeader(key: string, value: string): void;
	removeHeader(key: string): void;

	writeHead(code: number, headers?: HeadersObject): void;
	end(data: BodyInit | null): void;

	send(code: number, data?: any, headers?: HeadersObject): void;
}
