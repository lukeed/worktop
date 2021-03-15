import type { ServerRequest } from 'worktop';

// /**
//  * @template T
//  * @typedef Dict<T>
//  * @type {Record<string, T>}
//  */

// /**
//  * Converts a (Headers|FormData|URLSearchParams) into an Object.
//  * Is similar to `Object.fromEntries` except can collect multiple values for same key.
//  * @param {Headers|FormData|URLSearchParams} iter
//  * @returns {Dict<string|string[]>}
//  */
// export function toObject(iter) {
// 	let key, tmp, val, out = /** @type {Dict<string|string[]>} */({});
// 	for ([key, val] of iter) {
// 		if ((tmp = out[key]) !== void 0) {
// 			out[key] = [].concat(tmp, val);
// 		} else {
// 			out[key] = val;
// 		}
// 	}
// 	return out;
// }

/**
 * @TODO Cast `query` as object again?
 **/
export function request(event: FetchEvent): ServerRequest {
	const { request, waitUntil } = event;
	const { url, method, headers, cf } = request;
	const { hostname, pathname, search, searchParams } = new URL(url);

	// @ts-ignore - expects all properties upfront; this is
	const $body: ServerRequest['body'] = body.bind(0, request, headers.get('content-type'));
	$body.blob=request.blob; $body.text=request.text;
	$body.arrayBuffer = request.arrayBuffer;
	$body.formData = request.formData;
	$body.json = request.json;

	return {
		url, method, headers,
		hostname, path: pathname,
		search, query: searchParams,
		extend: waitUntil,
		body: $body,
		cf: cf,
	} as ServerRequest;
}

/**
 * @TODO Cast `formData` to object again?
 */
export async function body<T=unknown>(req: Request, ctype: string | null): Promise<T|FormData|ArrayBuffer|string|void> {
	if (!req.body || !ctype) return;
	if (!!~ctype.indexOf('application/json')) return req.json() as Promise<T>;
	if (!!~ctype.indexOf('multipart/form-data')) return req.formData();
	if (!!~ctype.indexOf('application/x-www-form-urlencoded')) return req.formData();
	return !!~ctype.indexOf('text/') ? req.text() : req.arrayBuffer();
}

export function isCachable(res: Response): boolean {
	if (res.status === 206) return false;

	const vary = res.headers.get('Vary') || '';
	if (!!~vary.indexOf('*')) return false;

	const ccontrol = res.headers.get('Cache-Control') || '';
	if (/(private|no-cache|no-store)/i.test(ccontrol)) return false;

	if (res.headers.has('Set-Cookie')) {
		res.headers.append('Cache-Control', 'private=Set-Cookie');
	}

	return true;
}
