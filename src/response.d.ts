/// <reference lib="webworker" />

type Arrayable<T> = T[] | T;
export type HeadersObject = Record<string, string>;

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
	setHeader(key: string, value: Arrayable<string|number>): void;
	removeHeader(key: string): void;

	writeHead(code: number, headers?: HeadersObject): void;
	end(data: BodyInit | null): void;

	send(code: number, data?: any, headers?: HeadersObject): void;
}
