import type { KV } from 'worktop/cfw.kv';

export { mimes } from 'mrmime';

export function serve(binding: KV.Namespace, request: Request|`/${string}`): Promise<Response | void>;
