import { connect } from 'worktop/ws';

import type { Context, Params } from 'worktop';
import type { State, SocketHandler } from 'worktop/cfw.ws';

export function listen<
	C extends Context = Context,
	P extends Params = Params,
	S extends State = State,
>(handler: SocketHandler<C, P, S>): (req: Request, context: C) => Response {
	return function (req, context) {
		let error = connect(req);
		if (error) return error;

		let { 0: client, 1: server } = new WebSocketPair;

		let state = {} as S;
		function caller(evt: Event) {
			return handler(req, context, {
				send: server.send.bind(server),
				close: server.close.bind(server),
				state: state,
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
