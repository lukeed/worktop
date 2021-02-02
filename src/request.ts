import { toObj } from './util';
import type { Method, Params } from './router';

export interface ServerRequest {
	url: string;
	method: Method;
	headers: Headers;
	body: any;
	path: string;
	query: Record<string, string | string[]>;
	search: string;
	event?: FetchEvent;
	params?: Params;
}

// TODO: originalUrl ?
export function toReq(req: Request): ServerRequest {
	const { url, method, headers } = req as Request & { method: Method };
	const { pathname:path, search, searchParams } = new URL(url);
	let body=null, query=toObj<string>(searchParams);
	return { url, method, headers, path, query, search, body };
}

export function toBody(req: Request, ctype: string): Promise<any> {
	if (ctype.includes('application/json')) return req.json();
	if (ctype.includes('application/text')) return req.text();
	if (ctype.includes('form')) return req.formData().then(toObj);
	return /text\/*/i.test(ctype) ? req.text() : req.blob();
}
