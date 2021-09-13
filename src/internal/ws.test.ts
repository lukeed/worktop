import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as ws from './ws';

const abort = suite('abort');

abort('should be a function', () => {
	assert.type(ws.abort, 'function');
});

abort('should return `Response` instance', () => {
	let res = ws.abort(400);
	assert.instance(res, Response);

	let headers = Object.fromEntries(res.headers);
	assert.is(headers['content-type'], 'text/plain');
	assert.is(headers['connection'], 'close');
});

abort('should handle `400` status', async () => {
	let text = 'Bad Request';
	let res = ws.abort(400);

	assert.is(res.status, 400);
	assert.is(res.statusText, text);
	assert.is(await res.text(), text);

	let clen = res.headers.get('Content-Length');
	assert.is(clen, '' + text.length);
});

abort('should handle `405` status', async () => {
	let text = 'Method Not Allowed';
	let res = ws.abort(405);

	assert.is(res.status, 405);
	assert.is(res.statusText, text);
	assert.is(await res.text(), text);

	let clen = res.headers.get('Content-Length');
	assert.is(clen, '' + text.length);
});

abort('should handle `426` status', async () => {
	let text = 'Upgrade Required';
	let res = ws.abort(426);

	assert.is(res.status, 426);
	assert.is(res.statusText, text);
	assert.is(await res.text(), text);

	let clen = res.headers.get('Content-Length');
	assert.is(clen, '' + text.length);
});

abort.run();
