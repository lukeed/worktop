import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as jwt from './jwt';

// @see internal/jwt.test.ts
const API = suite('re-exports');

API('INVALID', () => {
	assert.instance(jwt.INVALID, Error);
});

API('EXPIRED', () => {
	assert.instance(jwt.EXPIRED, Error);
});

API('decode', () => {
	assert.type(jwt.decode, 'function');
});

API.run();

// ---

const HS256 = suite('HS256');

HS256('should be a function', () => {
	assert.type(jwt.HS256, 'function');
});

HS256('should return a Factory object', () => {
	let ctx = jwt.HS256({ key: '123' });

	assert.type(ctx, 'object');
	assert.type(ctx.sign, 'function');
	assert.type(ctx.verify, 'function');
});

HS256('should sign a JWT input', async () => {
	let ctx = jwt.HS256({
		key: 'secret'
	});

	let token = await ctx.sign({
		iat: 1516239022,
		// @ts-ignore
		foo: 123
	});

	// note: confirm via jwt.io
	assert.is(token, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjIsImZvbyI6MTIzfQ.x-zNIj8_5JJF9BNJukHZXvc4fVnkQekXeBescZHdHSQ');

	assert.equal(jwt.decode(token), {
		header: {
			alg: 'HS256',
			typ: 'JWT',
		},
		payload: {
			iat: 1516239022,
			foo: 123,
		},
		signature: 'x-zNIj8_5JJF9BNJukHZXvc4fVnkQekXeBescZHdHSQ',
	});
});

HS256('should sign a JWT input :: expires', async () => {
	let ctx = jwt.HS256({
		key: 'secret',
		expires: 60 // secs
	});

	let token = await ctx.sign({
		iat: 1516239022,
		// @ts-ignore
		foo: 123,
		// "exp": 1516239082
	});

	// note: confirm via jwt.io
	assert.is(token, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE1MTYyMzkwMjIsImZvbyI6MTIzLCJleHAiOjE1MTYyMzkwODJ9.uKaZ6aCePkVPVXoG2YaDZJkrmHbN2qecB6uW1GvXhNk');

	assert.equal(jwt.decode(token), {
		header: {
			alg: 'HS256',
			typ: 'JWT',
		},
		payload: {
			iat: 1516239022,
			foo: 123,
			exp: 1516239082,
		},
		signature: 'uKaZ6aCePkVPVXoG2YaDZJkrmHbN2qecB6uW1GvXhNk',
	});
});

HS256('should sign a JWT input :: expires :: respect "exp" key', async () => {
	let ctx = jwt.HS256({
		key: 'secret',
		expires: 60 // secs
	});

	let token = await ctx.sign({
		exp: 1600000000,
		iat: 1516239022,
		// @ts-ignore
		foo: 123,
	});

	// note: confirm via jwt.io
	assert.is(token, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2MDAwMDAwMDAsImlhdCI6MTUxNjIzOTAyMiwiZm9vIjoxMjN9.tpyF15WdHDvB7Sjtkq-8wAAro6buCPpApxXTN33lIA4');

	assert.equal(jwt.decode(token), {
		header: {
			alg: 'HS256',
			typ: 'JWT',
		},
		payload: {
			exp: 1600000000,
			iat: 1516239022,
			foo: 123,
		},
		signature: 'tpyF15WdHDvB7Sjtkq-8wAAro6buCPpApxXTN33lIA4',
	});
});

HS256('should sign a JWT input :: kid', async () => {
	let ctx = jwt.HS256({
		key: 'secret',
		kid: 'hello',
	});

	let token = await ctx.sign({ iat: 1516239022 });
	assert.is(token, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImhlbGxvIn0.eyJpYXQiOjE1MTYyMzkwMjJ9._XmQIfxjpcau1gubu69xt5csWfSuDjL7StPWGEwpaec');

	assert.equal(jwt.decode(token), {
		header: {
			alg: 'HS256',
			typ: 'JWT',
			kid: 'hello',
		},
		payload: {
			iat: 1516239022
		},
		signature: '_XmQIfxjpcau1gubu69xt5csWfSuDjL7StPWGEwpaec',
	});
});

HS256('should sign a JWT input :: header claims', async () => {
	let ctx = jwt.HS256({
		key: 'secret',
		header: {
			foo: 123,
			bar: 456,
		},
	});

	let token = await ctx.sign({ iat: 1516239022 });
	assert.is(token, 'eyJmb28iOjEyMywiYmFyIjo0NTYsImFsZyI6IkhTMjU2IiwidHlwIjoiSldUIn0.eyJpYXQiOjE1MTYyMzkwMjJ9.suV0Ah7wahj83kWvHaF6M-ywaYVDj5y_BLSiR5gj2ic');

	assert.equal(jwt.decode(token), {
		header: {
			foo: 123,
			bar: 456,
			alg: 'HS256',
			typ: 'JWT',
		},
		payload: {
			iat: 1516239022
		},
		signature: 'suV0Ah7wahj83kWvHaF6M-ywaYVDj5y_BLSiR5gj2ic',
	});
});

// TODO: verify tests
// TODO: HS384,512 tests

HS256.run();
