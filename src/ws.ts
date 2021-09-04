import { abort } from './internal/ws';

import type { SocketHandler } from 'worktop/ws';
import type { Params, ServerRequest } from 'worktop/request';

// TODO: Might need to only be 400 code?
// @see https://datatracker.ietf.org/doc/rfc6455/?include_text=1
// @see https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
export function connect<P extends Params = Params>(req: ServerRequest<P> | Request) {
	if (req.method !== 'GET') return abort(405);

	let value = req.headers.get('upgrade');
	if (value !== 'websocket') return abort(426);

	value = (req.headers.get('sec-websocket-key') || '').trim();
	if (!/^[+/0-9A-Za-z]{22}==$/.test(value)) return abort(400);

	value = req.headers.get('sec-websocket-version');
	if (value !== '13') return abort(400);
}

type Context = Record<string, any>;

export function listen<
	P extends Params = Params,
	C extends Context = Context,
>(handler: SocketHandler<P, C>): (req: ServerRequest<P>) => Response {
	return function (req) {
		let error = connect(req);
		if (error) return error;

		let { 0: client, 1: server } = new WebSocketPair;

		let context = {} as C;
		function caller(evt: Event) {
			return handler(req, {
				send: server.send.bind(server),
				close: server.close.bind(server),
				context: context,
				// @ts-ignore
				event: evt
			});
		}

		async function closer(evt: Event) {
			try { await caller(evt) }
			finally { server.close() }
		}

		server.accept();

		// NOTE: currently "open" is never called
		// server.addEventListener('open', caller);
		server.addEventListener('close', closer);
		server.addEventListener('message', caller);
		server.addEventListener('error', closer);

		return new Response(null, {
			status: 101,
			statusText: 'Switching Protocols',
			webSocket: client
		});
	};
}
