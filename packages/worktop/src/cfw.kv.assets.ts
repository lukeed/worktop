import { lookup, mimes } from 'mrmime';
import type { KV } from 'worktop/cfw.kv';

export { mimes };

// TODO: last-modified / etag headers
// TODO: compare if-modified-since / if-none-match headers
export async function serve(ns: KV.Namespace, req: Request | `/${string}`): Promise<Response | void> {
	let isPath = typeof req === 'string';
	let isHEAD = !isPath && (req as Request).method === 'HEAD';
	let isGET = isPath || isHEAD || (req as Request).method === 'GET';
	if (!isGET) return;

	let path = isPath ? (req as string) : new URL((req as Request).url).pathname;
	if (!isPath && path.endsWith('/')) path += 'index.html';

	let item = await ns.get(path, 'arrayBuffer');
	if (item == null) return new Response(null, { status: 404 });

	let idx = path.lastIndexOf('.');
	let extn = !~idx ? path : path.substring(++idx);
	let isRange = !isPath && (req as Request).headers.get('range');

	let status = isRange ? 206 : 200;
	let total = item.byteLength;

	// 'last-modified': stats.mtime.toUTCString(),
	// 'etag': `W/"${total}-${stats.mtime.getTime()}"`
	let headers: HeadersInit = {
		'content-length': String(total)
	};

	extn = extn && lookup(extn) as string;
	if (extn) headers['content-type'] = extn;

	if (isRange) {
		// @see lukeed/sirv
		let [x, y] = isRange.replace('bytes=', '').split('-');
		let end = parseInt(y, 10) || total - 1;
		let start = parseInt(x, 10) || 0;

		if (start >= total || end >= total) {
			headers['content-range'] = `bytes */${total}`;
			return new Response(null, { status: 416, headers });
		}

		headers['content-range'] = `bytes ${start}-${end}/${total}`;
		headers['content-length'] = String(end - start + 1);
		headers['accept-ranges'] = 'bytes';

		item = item.slice(start, end);
	}

	return new Response(isHEAD ? null : item, { status, headers });
}
