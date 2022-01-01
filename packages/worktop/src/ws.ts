import { abort } from './internal/ws';

// TODO: Might need to only be 400 code?
// @see https://datatracker.ietf.org/doc/rfc6455/?include_text=1
// @see https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers
export function connect(req: Request) {
	if (req.method !== 'GET') return abort(405);

	let value = req.headers.get('upgrade');
	if (value !== 'websocket') return abort(426);

	value = (req.headers.get('sec-websocket-key') || '').trim();
	if (!/^[+/0-9A-Za-z]{22}==$/.test(value)) return abort(400);

	value = req.headers.get('sec-websocket-version');
	if (value !== '13') return abort(400);
}
