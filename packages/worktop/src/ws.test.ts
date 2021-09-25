import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as ws from './ws';

const connect = suite('connect');

connect('should be a function', () => {
	assert.type(ws.connect, 'function');
});

connect('should throw 405 if not GET request', () => {
	// @ts-ignore
	let out = ws.connect({ method: 'POST' });
	assert.instance(out, Response);
	// @ts-ignore - not promise
	assert.is(out.status, 405);
});

connect('should throw 426 if missing `Upgrade: websocket` header', () => {
	let headers = new Headers([
		['upgrade', 'other']
	]);

	// @ts-ignore
	let res = ws.connect({ method: 'GET', headers });
	assert.instance(res, Response);

	// @ts-ignore - not promise
	assert.is(res.status, 426);
});

connect('should throw 400 if missing `sec-websocket-key` header', () => {
	let headers = new Headers([
		['upgrade', 'websocket'],
		['Sec-WebSocket-Key', 'dGhlIHNhbXBub25jZQ==']
	]);

	// @ts-ignore
	let res = ws.connect({ method: 'GET', headers });
	assert.instance(res, Response);

	// @ts-ignore - not promise
	assert.is(res.status, 400);
});

connect('should throw 400 if invalid `sec-websocket-version` header', () => {
	let headers = new Headers([
		['upgrade', 'websocket'],
		['Sec-WebSocket-Version', '3']
	]);

	// @ts-ignore
	let res = ws.connect({ method: 'GET', headers });
	assert.instance(res, Response);

	// @ts-ignore - not promise
	assert.is(res.status, 400);
});

connect('should now throw error if valid handshake', () => {
	let headers = new Headers([
		['Upgrade', 'websocket'],
		['Connection', 'Upgrade'],
		['Sec-WebSocket-Key', 'dGhlIHNhbXBsZSBub25jZQ=='],
		['Sec-WebSocket-Version', '13']
	]);

	// @ts-ignore
	let res = ws.connect({ method: 'GET', headers });
	assert.is(res, undefined);
});

connect.run();

// ---

const listen = suite('listen');

listen('should be a function', () => {
	assert.type(ws.listen, 'function');
});

listen('should return a function', () => {
	let out = ws.listen(() => {});
	assert.type(out, 'function');
});

listen.run();
