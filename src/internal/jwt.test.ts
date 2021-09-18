import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as jwt from './jwt';

const Errors = suite('Errors');

Errors('INVALID', () => {
	assert.instance(jwt.INVALID, Error);
	assert.is(jwt.INVALID.message, 'Invalid token');
});

Errors('EXPIRED', () => {
	assert.instance(jwt.EXPIRED, Error);
	assert.is(jwt.EXPIRED.message, 'Expired token');
});

Errors.run();

// ---

const decode = suite('decode');

decode('should be a function', () => {
	assert.type(jwt.decode, 'function');
});

decode('should accept valid token string', () => {
	let output = jwt.decode('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
	assert.type(output, 'object');

	assert.equal(output.header, {
		alg: 'HS256',
		typ: 'JWT',
	});

	assert.equal(output.payload, {
		sub: '1234567890',
		name: 'John Doe',
		iat: 1516239022,
	});

	assert.type(output.signature, 'string');
	assert.is(output.signature, 'SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
});

decode.run();

// ---

const toASCII = suite('toASCII');

toASCII('should be a function', () => {
	assert.type(jwt.toASCII, 'function');
});

toASCII('should convert ArrayBuffer to base64url string', () => {
	let input = new TextEncoder().encode('"hello"');
	assert.is(jwt.toASCII(input), 'ImhlbGxvIg');
});

toASCII.run();

// ---

const encode = suite('encode');

encode('should be a function', () => {
	assert.type(jwt.encode, 'function');
});

encode('should cast to base64url string :: string', () => {
	assert.is(
		// @ts-ignore
		jwt.encode('hello'),
		'ImhlbGxvIg'
	);
});

encode('should cast to base64url string :: JSON', () => {
	assert.is(
		jwt.encode({ alg: 'HS256' }),
		'eyJhbGciOiJIUzI1NiJ9'
	);

	assert.is(
		jwt.encode({ alg: 'HS256', typ: 'JWT' }),
		'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'
	);
});

encode.run();
