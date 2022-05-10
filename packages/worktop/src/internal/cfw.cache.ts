import type { KV } from 'worktop/cfw.kv';

export function normalize(value: unknown): KV.Value {
	return (
		typeof value === 'string'
		|| value instanceof ArrayBuffer
		|| value instanceof ReadableStream
	) ? value : JSON.stringify(value);
}

const toCacheKey = (key: string) => `cache://${encodeURIComponent(key)}`;

export class Entity {
	get(key: string): Promise<Response|void> {
		let k = toCacheKey(key);
		return caches.default.match(k);
	}

	put<T>(key: string, value: T|null, ttl: number): Promise<boolean> {
		if (!ttl) return Promise.resolve(true);

		let headers = { 'cache-control': `public,max-age=${ttl}` };
		let body = value == null ? null : normalize(value);
		let res = new Response(body, { headers });

		let k = toCacheKey(key);
		return caches.default.put(k, res).then(
			() => true,
			() => false
		);
	}

	delete(key: string): Promise<boolean> {
		let k = toCacheKey(key);
		return caches.default.delete(k);
	}
}
