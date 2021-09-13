/// <reference lib="webworker" />
import type { Arrayable, Dict } from 'worktop/utils';

export type HeadersObject = Dict<string>;

/**
 * Status text messages for common 4xx & 5xx status codes.
 * @NOTE Mutable dictionary; add or customize as needed.
 */
export declare var STATUS_CODES: Record<string|number, string>;

export function finalize(res: Response, isHEAD?: boolean): Response;

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
