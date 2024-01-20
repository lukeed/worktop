import * as Cache from 'worktop/cache';
import { STATUS_CODES } from 'worktop/response';

import type { Handler } from 'worktop';
import type { Dict } from 'worktop/utils';
import type { R2, Options } from 'worktop/cfw.r2';

export async function * list<M extends R2.Metadata.Custom>(
	binding: R2.Bucket,
	options?: R2.Options.List
): AsyncGenerator<{ done: boolean; objects: R2.Object.Metadata<M>[] }> {
	options = options || {}
	let cursor = options.cursor;

	while (true) {
		options.cursor = cursor;
		let results = await binding.list<M>(options);
		let isDone = !results.cursor && !results.truncated;
		cursor = results.cursor;

		yield {
			objects: results.objects,
			done: isDone,
		};

		if (isDone) return;
	}
}

export async function paginate<M extends R2.Metadata.Custom>(
	binding: R2.Bucket,
	options?: Options.Paginate
): Promise<R2.Object.Metadata<M>[]> {
	let { limit=50, page=1, ...rest } = options || {};
	let pager = list<M>(binding, rest);

	for await (let result of pager) {
		// page target exceeds total
		if (--page && result.done) return [];
		else if (page === 0) return result.objects;
	}

	return [];
}

function reply(status: number, msg?: string) {
	return new Response(msg || STATUS_CODES[status], { status });
}

function $exec<T>(x: T, ...args: any[]): Exclude<T, Function> {
	return typeof x === 'function' ? x(...args) : x;
}

type CacheSettings = Exclude<Options.Sync['cache'], boolean>;
export function sync(options: Options.Sync): Handler {
	const toCache = options.cache !== false;
	const settings: CacheSettings = {
		storage: caches.default,
		lifetime: 'public,max-age=3600',
		...options.cache as CacheSettings,
	};

	let cache: Cache;
	return async function (req, context) {
		const isGET = req.method === 'GET';
		const isHEAD = req.method === 'HEAD';
		if (!isGET && !isHEAD) return reply(405);

		let key: Request;
		let res: Response | void;

		// TODO: not sure if this is ideal / necessary
		let path = decodeURIComponent(context.url.pathname);
		if (path.endsWith('/')) path += 'index.html';

		if (toCache) {
			cache ||= await $exec(settings.storage!);

			let href = $exec(settings.key) || encodeURIComponent(path);
			if (!/^\w+:\/\//.test(href)) href = `r2://${href}`;

			key = new Request(href, req);
			key.headers.delete('vary');

			res = await cache.match(key, { ignoreMethod: true });
			if (res && isHEAD) res = new Response(null, res);
			if (res) return res;
		}

		const bkt = $exec(options.bucket, context);
		res = await serve(bkt, req);

		if (toCache) {
			let value = $exec(settings.lifetime, req);
			let cc = value && typeof value === 'number'
				? `public,max-age=${value}`
				: value;

			if (cc) res.headers.set('cache-control', cc);

			if (isGET && res.status !== 206) {
				return Cache.save(cache, key!, res, context);
			}
		}

		return res;
	};
}

export async function serve(bkt: R2.Bucket, req: Request | `/${string}`): Promise<Response> {
	let path = typeof req === 'string' ? req : decodeURIComponent(new URL(req.url).pathname);
	if (path.endsWith('/')) path += 'index.html';

	let request = typeof req !== 'string'
		? new Request(path, req)
		: new Request(path);

	let isHEAD = request.method === 'HEAD';
	if (!isHEAD && request.method !== 'GET') {
		return reply(405);
	}

	// TODO: how good is default `contentType` value?
	// let idx = path.lastIndexOf('.');
	// let extn = !~idx ? path : path.substring(++idx);

	let tmp: string | null;
	let headers: HeadersInit = {};
	let options: R2.Options.Get = {
		onlyIf: request.headers
	};

	// TODO: If-Range: <day-name>, <day> <month> <year> <hour>:<minute>:<second> GMT
	// TODO: If-Range: <etag>

	if (tmp = request.headers.get('range')) {
		// @see lukeed/sirv
		// r2 only supports 1 range (temp)
		// @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range
		let value = tmp.split(/,\s*/, 1)[0].replace('bytes=', '');

		// bytes=-123
		if (value.charAt(0) === '-') {
			let suffix = -parseInt(value, 10);
			options.range = { suffix };
		} else {
			// bytes=123-
			// bytes=123-456
			let [x, y] = value.split('-');

			let end = parseInt(y, 10);
			let offset = parseInt(x, 10) || 0;
			let length = end ? (end - offset + 1) : undefined;
			options.range = { offset, length };
		}
	}

	try {
		var result = await bkt.get(path.substring(1), options);
		if (result == null) return reply(404);

		// missing `body` key if failed precondition
		if (!(result as R2.Object).body) {
			let isMatch = request.headers.has('if-none-match') || request.headers.get('if-modified-since');
			return reply(isMatch ? 304 : 412);
		}

		let status = options.range ? 206 : 200;
		let b = isHEAD ? null : (result as R2.Object).body;
		var res = new Response(b, { status, headers });
		res.headers.set('etag', result.httpEtag);
		result.writeHttpMetadata(res.headers);
	} catch (err) {
		// grab the R2 error code
		let [, code] = /\((\d+)\)$/.exec((err as Error).message) || [];
		if (code === '10039') return reply(416); // range error
		if (code === '10020') return reply(400, 'Invalid object name');
		if (code === '10002') return reply(401);
		if (code === '10003') return reply(403, 'Access Denied');
		if (code === '10043') return reply(503);
		return reply(500); // or 10001
	}

	if (options.range) {
		let total = result.size;

		// @ts-ignore - union interfaces
		let { suffix, offset, length } = options.range as Dict<number>;

		if (suffix) {
			offset = Math.max(total - suffix, 0);
			length = total - offset;
		} else if (offset) {
			length = Math.min(length ?? total, total - offset);
		} else if (length) {
			length = Math.min(length, total);
			offset = 0;
		}

		res.headers.set('accept-ranges', 'bytes');
		res.headers.set('content-length', String(length));
		res.headers.set('content-range', `bytes ${offset}-${offset+length}/${total}`);
	}

	return res;
}
