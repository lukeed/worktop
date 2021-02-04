/// <reference lib="webworker" />

// worktop/cache
export const Cache: Cache;
export function isCachable(res: Response): boolean;
export function toCache(event: FetchEvent, res: Response): Response;

// worktop/router
export type Route = { params: Params; handler: Handler | false };
export type Handler = (req: ServerRequest, res: ServerResponse) => void | Response | Promise<void | Response>;
export type Params = Record<string, string>;
export declare class Router {
	add(method: string, route: RegExp | string, handler: Handler): void;
	find(method: string, pathname: string): Route;
	run(request: Request): Promise<Response>;
	listen(event: FetchEvent): void;
}

// worktop/request
export interface ServerRequest {
	method: string;
	url: string;
	path: string;
	params: Params;
	query: URLSearchParams;
	search: string;
	headers: Headers;
	body: any;
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
