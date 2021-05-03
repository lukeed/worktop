import { abort } from './internal/ws';

import type { Handler } from 'worktop';
import type { MessageHandler } from 'worktop/ws';

// @todo Might need to only be 400 code?
// @see https://datatracker.ietf.org/doc/rfc6455/?include_text=1
// @see https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
export const connect: Handler = function (req) {
	if (req.method !== 'GET') return abort(405);

	let value = req.headers.get('upgrade');
	if (value !== 'websocket') return abort(426);

	// TODO: does cloudflare handle this?
	value = (req.headers.get('sec-websocket-key') || '').trim();
	if (!/^[+/0-9A-Za-z]{22}==$/.test(value)) return abort(400);

	// TODO: does cloudflare handle this?
	value = req.headers.get('sec-websocket-version');
	if (value !== '8' && value !== '13') return abort(400);
}

export function listen(handler: MessageHandler): Handler {
	return function (req, res) {
		let error = connect(req, res);
		if (error) return error;

		let { 0: client, 1: server } = new WebSocketPair;

		server.accept();
		server.addEventListener('message', async evt => {
			await handler(req, {
				send: server.send,
				close: server.close,
				data: evt.data,
			});
		});

		// TODO?
		// 'Upgrade: websocket',
		// 'Connection: Upgrade',
		// `Sec-WebSocket-Accept: ${digest}`
		return new Response(null, {
			status: 101,
			statusText: 'Switching Protocols',
			webSocket: client
		});
	};
}
