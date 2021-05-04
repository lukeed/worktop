import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as ws from './ws';

// @ts-ignore -> workaround for bad/lazy Response mock
const toHeaders = (h: Headers): Record<string, string> => h;

const abort = suite('abort');

abort('should be a function', () => {
	assert.type(ws.abort, 'function');
});

abort('should return `Response` instance', () => {
	let out = ws.abort(400);
	assert.instance(out, Response);

	let headers = toHeaders(out.headers);
	assert.is(headers['Content-Type'], 'text/plain');
	assert.is(headers['Connection'], 'close');
});

abort('should handle `400` status', () => {
	let text = 'Bad Request';
	let res = ws.abort(400);

	assert.is(res.status, 400);
	assert.is(res.statusText, text);
	assert.is(res.body, text);

	let clen = toHeaders(res.headers)['Content-Length'];
	assert.is(clen, '' + text.length);
});

abort('should handle `405` status', () => {
	let text = 'Method Not Allowed';
	let res = ws.abort(405);

	assert.is(res.status, 405);
	assert.is(res.statusText, text);
	assert.is(res.body, text);

	let clen = toHeaders(res.headers)['Content-Length'];
	assert.is(clen, '' + text.length);
});

abort('should handle `426` status', () => {
	let text = 'Upgrade Required';
	let res = ws.abort(426);

	assert.is(res.status, 426);
	assert.is(res.statusText, text);
	assert.is(res.body, text);

	let clen = toHeaders(res.headers)['Content-Length'];
	assert.is(clen, '' + text.length);
});

abort.run();
