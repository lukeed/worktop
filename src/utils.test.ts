import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as utils from './utils';

// @ts-ignore - missing def
import isUUID from 'is-uuid';

// ---

// https://github.com/lukeed/uid/blob/master/test/secure.js
const uid = suite('uid');

uid('should be a function', () => {
	assert.type(utils.uid, 'function');
});

uid('should return 11-character string (default)', () => {
	let output = utils.uid();
	assert.type(output, 'string');
	assert.is(output.length, 11);
});

uid('length :: 4', () => {
	let i=0, tmp;
	for (; i < 1e3; i++) {
		tmp = utils.uid(4);
		assert.is(tmp.length, 4, `"${tmp}" is not 4 characters!`);
	}
});

uid('length :: 5', () => {
	let i=0, tmp;
	for (; i < 1e3; i++) {
		tmp = utils.uid(5);
		assert.is(tmp.length, 5, `"${tmp}" is not 5 characters!`);
	}
});

uid('length :: 6', () => {
	let i=0, tmp;
	for (; i < 1e3; i++) {
		tmp = utils.uid(6);
		assert.is(tmp.length, 6, `"${tmp}" is not 6 characters!`);
	}
});

uid('unique', () => {
	let items = new Set();
	for (let i=50e3; i--;) items.add(utils.uid());
	assert.is(items.size, 50e3, '~> 50,000 uniques');
});

uid.run();

// ---

// https://github.com/lukeed/uuid/blob/master/test/secure.js
const uuid = suite('uuid');

uuid('exports', () => {
	assert.type(utils.uuid, 'function', 'exports function');
});

uuid('returns', () => {
	let out = utils.uuid();
	assert.type(out, 'string', 'returns a string');
	assert.is(out.length, 36, '~> 36 characters long');
});

uuid('unique', () => {
	let length = 50e3;
	assert.is.not(utils.uuid(), utils.uuid(), '~> single');
	let unique = new Set(Array.from({ length }, utils.uuid));
	assert.is(unique.size, length, '~> 50,000 uniques');
});

uuid('validate', () => {
	let arr = Array.from({ length: 1e3 }, utils.uuid);
	assert.ok(arr.every(isUUID.v4));
});

uuid.run();

// ---

const ulid = suite('ulid');

ulid('exports', () => {
	assert.type(utils.ulid, 'function', 'exports function');
});

ulid('returns', () => {
	let out = utils.ulid();
	assert.type(out, 'string', 'returns a string');
	assert.is(out.length, 26, '~> 26 characters long');
});

ulid('unique', () => {
	let length = 50e3;
	assert.is.not(utils.ulid(), utils.ulid(), '~> single');
	let unique = new Set(Array.from({ length }, utils.ulid));
	assert.is(unique.size, length, '~> 50,000 uniques');
});

ulid('validate', () => {
	let input = new Set(
		Array.from({ length: 1e3 }, () => {
			return utils.ulid().substring(0, 10);
		})
	);

	let raw = [...input];
	let copy = [...input].sort();
	assert.equal(raw, copy, '~> time sort order');
});

ulid.run();

// ---

const byteLength = suite('byteLength');

byteLength('should be a function', () => {
	assert.type(utils.byteLength, 'function');
});

byteLength('should return 0 for empty inputs', () => {
	assert.is(utils.byteLength(), 0);
	assert.is(utils.byteLength(undefined), 0);
	assert.is(utils.byteLength(''), 0);
});

byteLength('should return 0 for empty inputs', () => {
	assert.is(utils.byteLength(), 0);
	assert.is(utils.byteLength(undefined), 0);
	assert.is(utils.byteLength(''), 0);
});

byteLength('should return the correct value', () => {
	assert.is(utils.byteLength('1'), 1);
	assert.is(utils.byteLength('123'), 3);
	assert.is(utils.byteLength('🙌🏼'), 8);
});

byteLength.run();

// ---

const randomize = suite('randomize');

randomize('should be a function', () => {
	assert.type(utils.randomize, 'function');
});

randomize('should return a `Uint8Array` instance of `size` length', () => {
	let output = utils.randomize(11);
	assert.instance(output, Uint8Array);
	assert.is(output.byteLength, 11);
	assert.is(output.length, 11);
});

randomize('should return unique number values', () => {
	let foo = utils.randomize(11).join(',');
	let bar = utils.randomize(11).join(',');
	assert.is.not(foo, bar);
});

randomize.run();

// ---

const Encoder = suite('Encoder');

Encoder('should be a `TextEncoder` instance', () => {
	assert.instance(utils.Encoder, TextEncoder);
});

Encoder('should have the `encode` method', () => {
	assert.type(utils.Encoder.encode, 'function');
});

Encoder.run();

// ---

const Decoder = suite('Decoder');

Decoder('should be a `TextDecoder` instance', () => {
	assert.instance(utils.Decoder, TextDecoder);
});

Decoder('should have the `decode` method', () => {
	assert.type(utils.Decoder.decode, 'function');
});

Decoder.run();

// ---

const encode = suite('encode');

encode('should be a function', () => {
	assert.type(utils.encode, 'function');
});

encode('should return `Uint8Array` output', () => {
	assert.instance(utils.encode(''), Uint8Array);
});

encode('should return encoded values', () => {
	assert.equal(
		utils.encode('hello'),
		new Uint8Array([104, 101, 108, 108, 111])
	);

	assert.equal(
		utils.encode('world'),
		new Uint8Array([119, 111, 114, 108, 100])
	);

	assert.equal(
		utils.encode(''),
		new Uint8Array([])
	);

	assert.equal(
		utils.encode(' '),
		new Uint8Array([32])
	);

	assert.equal(
		utils.encode('€'),
		new Uint8Array([226, 130, 172])
	);
});

encode.run();

// ---

const decode = suite('decode');

decode('should be a function', () => {
	assert.type(utils.decode, 'function');
});

decode('should return `string` output', () => {
	assert.type(utils.decode(new Uint8Array), 'string');
});

// TODO: add `stream` option tests
decode('should return decoded values', () => {
	assert.equal(
		utils.decode(new Uint8Array([104, 101, 108, 108, 111])),
		'hello',
	);

	assert.equal(
		utils.decode(new Uint8Array([119, 111, 114, 108, 100])),
		'world',
	);

	assert.equal(
		utils.decode(new Uint8Array([])),
		'',
	);

	assert.equal(
		utils.decode(new Uint8Array([32])),
		' ',
	);

	assert.equal(
		utils.decode(new Uint8Array([226, 130, 172])),
		'€',
	);
});

decode.run();

// ---

const toObject = suite('toObject');

toObject('should be a function', () => {
	assert.type(utils.toObject, 'function');
});

toObject('should match `Object.fromEntries` for simple values', () => {
	let input = new URLSearchParams();
	input.set('hello', 'world');
	input.set('foo', 'bar');

	assert.equal(
		utils.toObject(input),
		Object.fromEntries(input)
	);
});

toObject('should keep multiple values per key', () => {
	let input = new URLSearchParams();
	input.append('hello', 'world');
	input.append('hello', 'there');
	input.set('foo', 'bar');

	const output = utils.toObject(input);
	assert.not.equal(output, Object.fromEntries(input));

	assert.equal(output, {
		foo: 'bar',
		hello: ['world', 'there']
	});
});

toObject.run();

// ---

const body = suite('body');

const Request = (type?: string): any => ({
	body: true,
	headers: new Map([['content-type', type]]),
	json: () => 'json',
	arrayBuffer: () => 'arrayBuffer',
	formData: () => Promise.resolve(new URLSearchParams),
	text: () => 'text',
});

body('should be a function', () => {
	assert.type(utils.body, 'function');
});

body('should return nothing if nullish `ctype` value', async () => {
	const req = Request();
	const output = await utils.body(req);
	assert.is(output, undefined);
});

body('should return nothing if missing `req.body` value', async () => {
	const req = Request('foo');
	req.body = false; // should not happen
	const output = await utils.body(req);
	assert.is(output, undefined);
});

body('should react to content-type :: json()', async () => {
	const req = Request('application/json');
	const output = await utils.body(req);
	assert.is(output, 'json');
});

body('should react to content-type :: formData()', async () => {
	const foo = Request('multipart/form-data');
	assert.equal(await utils.body(foo), {});

	const bar = Request('application/x-www-form-urlencoded');
	assert.equal(await utils.body(bar), {});
});

body('should react to content-type :: text()', async () => {
	const req = Request('text/plain');
	const output = await utils.body(req);
	assert.is(output, 'text');
});

body('should react to content-type :: arrayBuffer()', async () => {
	const req = Request('anything/fallback');
	const output = await utils.body(req);
	assert.is(output, 'arrayBuffer');
});

body('should parse Response body :: text()', async () => {
	let res = new Response('[1,2,3]');
	res.headers.set('content-type', 'text/plain');
	let output = await utils.body(res);
	assert.equal(output, '[1,2,3]');
});

body('should parse Response body :: json()', async () => {
	let res = new Response('[1,2,3]');
	res.headers.set('content-type', 'application/json');
	let output = await utils.body(res);
	assert.equal(output, [1, 2, 3]);
});

body('should parse Response w/ null body', async () => {
	let res = new Response(null);
	let output = await utils.body(res);
	assert.is(output, undefined);
});

body.run();
