import type * as worktop from 'worktop';
import type { KV } from 'worktop/kv';

export interface Context extends worktop.Context {
	bindings: {
		TODOS: KV.Namespace;
	};
}

export type Handler = worktop.Handler<Context>;
