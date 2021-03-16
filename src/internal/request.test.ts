import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as request from './request';

const toObject = suite('toObject');

toObject('should be a function', () => {
	assert.type(request.toObject, 'function');
});

toObject('should match `Object.fromEntries` for simple values', () => {
	let input = new URLSearchParams();
	input.set('hello', 'world');
	input.set('foo', 'bar');

	assert.equal(
		request.toObject(input),
		Object.fromEntries([...input])
	);
});

toObject('should keep multiple values per key', () => {
	let input = new URLSearchParams();
	input.append('hello', 'world');
	input.append('hello', 'there');
	input.set('foo', 'bar');

	const output = request.toObject(input);
	assert.not.equal(output, Object.fromEntries([...input]));

	assert.equal(output, {
		foo: 'bar',
		hello: ['world', 'there']
	});
});

toObject.run();

// ---

const body = suite('body');
const Request = (): any => ({
	body: true,
	json: () => 'json',
	arrayBuffer: () => 'arrayBuffer',
	formData: () => Promise.resolve(new URLSearchParams),
	text: () => 'text',
});

body('should be a function', () => {
	assert.type(request.body, 'function');
});

body('should return nothing if nullish `ctype` value', async () => {
	const req = Request();
	const output = await request.body(req, null);
	assert.is(output, undefined);
});

body('should return nothing if missing `req.body` value', async () => {
	const req = Request();
	req.body = false; // should not happen
	const output = await request.body(req, 'foo');
	assert.is(output, undefined);
});

body('should react to content-type :: json()', async () => {
	const req = Request();
	const output = await request.body(req, 'application/json');
	assert.is(output, 'json');
});

body('should react to content-type :: formData()', async () => {
	const req = Request();
	const output = request.toObject(new URLSearchParams);
	assert.equal(await request.body(req, 'multipart/form-data'), output);
	assert.equal(await request.body(req, 'application/x-www-form-urlencoded'), output);
});

body('should react to content-type :: text()', async () => {
	const req = Request();
	const output = await request.body(req, 'text/plain');
	assert.is(output, 'text');
});

body('should react to content-type :: arrayBuffer()', async () => {
	const req = Request();
	const output = await request.body(req, 'anything else');
	assert.is(output, 'arrayBuffer');
});

body.run();
