import { connect } from 'worktop/ws';

import type { Context, Params } from 'worktop';
import type { State, SocketHandler } from 'worktop/deno.ws';

declare const Deno: {
	upgradeWebSocket(req: Request): {
		websocket: WebSocket;
		response: Response;
	}
};

export function listen<
	C extends Context = Context,
	P extends Params = Params,
	S extends State = State,
>(handler: SocketHandler<C, P, S>): (req: Request, context: C) => Response {
	return function (req, context) {
		let error = connect(req);
		if (error) return error;

		let state = {} as S;
		let { websocket, response } = Deno.upgradeWebSocket(req);

		function caller(evt: Event) {
			return handler(req, context, {
				send: websocket.send.bind(websocket),
				close: websocket.close.bind(websocket),
				state: state,
				// @ts-ignore
				event: evt
			});
		}

		async function closer(evt: Event) {
			try { await caller(evt) }
			finally { websocket.close() }
		}

		websocket.onopen = websocket.onmessage = caller;
		websocket.onclose = websocket.onerror = closer;

		return response;
	};
}
