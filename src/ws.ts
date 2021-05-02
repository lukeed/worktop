import { abort } from './internal/ws';

import type { Handler } from 'worktop';
import type { WebSocket } from 'worktop/ws';

export const connect: Handler = function (req, res) {
	if (req.method !== 'GET') return abort(405);

	let value = req.headers.get('upgrade');
	if (value !== 'websocket') return abort(426);

	// TODO: need this?
	value = (req.headers.get('sec-websocket-key') || '').trim();
	if (!/^[+/0-9A-Za-z]{22}==$/.test(value.trim())) return abort(400);

	// TODO: need this?
	value = req.headers.get('sec-websocket-version');
	if (value !== '8' && value !== '13') return abort(400);

	let { 0: client, 1: server } = new WebSocketPair;

	server.accept();
	// server.addEventListener('message', );

	// TODO?
	// 'Upgrade: websocket',
	// 'Connection: Upgrade',
	// `Sec-WebSocket-Accept: ${digest}`
	return new Response(null, {
		status: 101,
		statusText: 'Switching Protocols',
		webSocket: client
	});
}
