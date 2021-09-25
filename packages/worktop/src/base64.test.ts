import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as base64 from './base64';

// ---

const encode = suite('encode');

encode('should be a function', () => {
	assert.type(base64.encode, 'function');
});

encode('should return raw Base64 values', () => {
	assert.is(base64.encode('a'), 'YQ==');
	assert.is(base64.encode('hello'), 'aGVsbG8=');
	assert.is(base64.encode('hello world!'), 'aGVsbG8gd29ybGQh');
	assert.is(base64.encode('{PP}~~!'), 'e1BQfX5+IQ==');
});

encode.run();

// ---

const base64url = suite('base64url');

base64url('should be a function', () => {
	assert.type(base64.base64url, 'function');
});

base64url('should return URL-safe Base64 values', () => {
	assert.is(base64.base64url('a'), 'YQ');
	assert.is(base64.base64url('hello'), 'aGVsbG8');
	assert.is(base64.base64url('hello world!'), 'aGVsbG8gd29ybGQh');
	assert.is(base64.base64url('{PP}~~!'), 'e1BQfX5-IQ');
});

base64url.run();

// ---

const decode = suite('decode');

decode('should be a function', () => {
	assert.type(base64.decode, 'function');
});

decode('should decode raw Base64 values', () => {
	assert.is(base64.decode('YQ=='), 'a');
	assert.is(base64.decode('aGVsbG8='), 'hello');
	assert.is(base64.decode('aGVsbG8gd29ybGQh'), 'hello world!');
	assert.is(base64.decode('e1BQfX5+IQ=='), '{PP}~~!');
});

decode('should decode URL-safe Base64 values', () => {
	assert.is(base64.decode('YQ'), 'a');
	assert.is(base64.decode('aGVsbG8'), 'hello');
	assert.is(base64.decode('aGVsbG8gd29ybGQh'), 'hello world!');
	assert.is(base64.decode('e1BQfX5-IQ'), '{PP}~~!');
});

decode.run();
