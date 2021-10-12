import type { KV } from 'worktop/kv';
import type { Context } from 'worktop';

export { mimes } from 'mrmime';

export function serve(binding: KV.Namespace, request: Request|`/${string}`, context: Context): Promise<Response | void>;
