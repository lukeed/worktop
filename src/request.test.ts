import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import { ServerRequest } from './request';

const request = suite('ServerRequest');
const Event = (): any => ({
	waitUntil() {},
	request: {
		url: 'http://localhost/',
		method: 'GET',
		headers: new Map,
		json: () => 'json',
		formData: () => 'formData',
		arrayBuffer: () => 'arrayBuffer',
		text: () => 'text',
		blob: () => 'blob',
		cf: {},
	}
});

request('should be a function', () => {
	assert.type(ServerRequest, 'function');
});

request('should return an instance', () => {
	const event = Event();
	// @ts-ignore - source is function
	const req = new ServerRequest(event);
	assert.instance(req, ServerRequest);
});

request('should have instance properties', () => {
	const event = Event();
	event.request.url += 'foo/bar?hello=1&world=2';
	event.request.headers.set('x-foo', 'x-bar');
	// @ts-ignore - source is function
	const req = new ServerRequest(event);

	assert.is(req.url, event.request.url);
	assert.is(req.method, 'GET');
	assert.ok(req.headers === event.request.headers);
	assert.ok(req.extend === event.waitUntil);
	assert.type(req.extend, 'function');
	assert.ok(req.cf === event.request.cf);
	assert.equal(req.params, {});

	const url = new URL(req.url);
	assert.is(req.path, url.pathname);
	assert.is(req.hostname, url.hostname);
	assert.is(req.origin, url.origin);
	assert.instance(req.query, URLSearchParams);
	assert.equal(req.query, url.searchParams);
	assert.is(req.search, url.search);

	assert.type(req.body, 'function');
	assert.type(req.body.blob, 'function');
	assert.type(req.body.text, 'function');
	assert.type(req.body.arrayBuffer, 'function');
	assert.type(req.body.formData, 'function');
	assert.type(req.body.json, 'function');
});

request.run();
