import { suite } from 'uvu';
import { promisify } from 'util';
import * as assert from 'uvu/assert';
import { createHash, createHmac, pbkdf2 } from 'crypto';
import * as crypto from './crypto';
import { toHEX } from './buffer';

import type { Algorithms } from './crypto.d';

const digest = suite('digest');

digest('should be a function', () => {
	assert.type(crypto.digest, 'function');
});

digest('should return a string', async () => {
	let output = await crypto.digest('SHA-1', 'hello');
	assert.type(output, 'string');
});

digest.run();

// ---

const SHA1 = suite('SHA1', {
	async compare(input: string) {
		assert.is(
			await crypto.SHA1(input),
			createHash('sha1').update(input).digest('hex'),
			`~> "${input}"`
		);
	}
});

SHA1('should be a function', () => {
	assert.type(crypto.SHA1, 'function');
});

SHA1('should return correct values as hexstrings', async ctx => {
	await ctx.compare('');
	await ctx.compare('hello');
	await ctx.compare('hello123');
	await ctx.compare('"foo … bar"');
});

SHA1.run();

// ---

const SHA256 = suite('SHA256', {
	async compare(input: string) {
		assert.is(
			await crypto.SHA256(input),
			createHash('sha256').update(input).digest('hex'),
			`~> "${input}"`
		);
	}
});

SHA256('should be a function', () => {
	assert.type(crypto.SHA256, 'function');
});

SHA256('should return correct values as hexstrings', async ctx => {
	await ctx.compare('');
	await ctx.compare('hello');
	await ctx.compare('hello123');
	await ctx.compare('"foo … bar"');
});

SHA256.run();

// ---

const SHA384 = suite('SHA384', {
	async compare(input: string) {
		assert.is(
			await crypto.SHA384(input),
			createHash('sha384').update(input).digest('hex'),
			`~> "${input}"`
		);
	}
});

SHA384('should be a function', () => {
	assert.type(crypto.SHA384, 'function');
});

SHA384('should return correct values as hexstrings', async ctx => {
	await ctx.compare('');
	await ctx.compare('hello');
	await ctx.compare('hello123');
	await ctx.compare('"foo … bar"');
});

SHA384.run();

// ---

const SHA512 = suite('SHA512', {
	async compare(input: string) {
		assert.is(
			await crypto.SHA512(input),
			createHash('sha512').update(input).digest('hex'),
			`~> "${input}"`
		);
	}
});

SHA512('should be a function', () => {
	assert.type(crypto.SHA512, 'function');
});

SHA512('should return correct values as hexstrings', async ctx => {
	await ctx.compare('');
	await ctx.compare('hello');
	await ctx.compare('hello123');
	await ctx.compare('"foo … bar"');
});

SHA512.run();

// ---

const keyload = suite('keyload');

keyload('should be a function', () => {
	assert.type(crypto.keyload, 'function');
});

keyload.run();

// ---

const keygen = suite('keygen');

keygen('should be a function', () => {
	assert.type(crypto.keygen, 'function');
});

keygen.run();

// ---

const sign = suite('sign');

sign('should be a function', () => {
	assert.type(crypto.sign, 'function');
});

sign.run();

// ---

const verify = suite('verify');

verify('should be a function', () => {
	assert.type(crypto.verify, 'function');
});

verify.run();

// ---

const timingSafeEqual = suite('timingSafeEqual');

timingSafeEqual('should be a function', () => {
	assert.type(crypto.timingSafeEqual, 'function');
});

timingSafeEqual('true :: compare to self', () => {
	let input = new Uint8Array([1, 2, 3, 4, 5]);
	let output = crypto.timingSafeEqual(input, input);
	assert.is(output, true);
});

timingSafeEqual('true :: compare to clone', () => {
	let raw = [1, 2, 3, 4, 5];
	let result = crypto.timingSafeEqual(
		new Uint8Array(raw), new Uint8Array(raw),
	);
	assert.is(result, true);
});

timingSafeEqual('false :: byteLength', () => {
	assert.not.ok(
		crypto.timingSafeEqual(
			new Uint8Array(1),
			new Uint8Array(12)
		)
	);
});

timingSafeEqual('false :: values', () => {
	assert.not.ok(
		crypto.timingSafeEqual(
			new Uint8Array([1, 2, 3]),
			new Uint8Array([1, 2, 5])
		)
	);
});

timingSafeEqual.run();


// ---

const PBKDF2 = suite('PBKDF2', {
	async compare(payload: string, salt: string) {
		// @see https://nodejs.org/api/crypto.html#crypto_crypto_pbkdf2_password_salt_iterations_keylen_digest_callback
		let nodejs = await promisify(pbkdf2)(payload, salt, 100e3, 64, 'sha512');
		let web = toHEX(await crypto.PBKDF2('SHA-512', payload, salt, 100e3, 64));
		assert.is(web, nodejs.toString('hex'), `~> "${ payload }"`);
	}
});

PBKDF2('should be a function', () => {
	assert.type(crypto.PBKDF2, 'function');
});

PBKDF2('should produce expected output', async ctx => {
	await ctx.compare('secret123', 'salt');
	await ctx.compare('foo … bar', 'salt123');
});

PBKDF2.run();

// ---

const HMAC = suite('HMAC', {
	async compare(algo: Algorithms.Digest, payload: string, secret: string) {
		let native = createHmac(algo.replace('-', '').toLowerCase(), secret).update(payload).digest('hex');
		let output = await crypto.HMAC(algo, secret, payload).then(toHEX);
		assert.is(output, native, `~> "${payload}"`);
	}
});

HMAC('should be a function', () => {
	assert.type(crypto.HMAC, 'function');
	assert.type(crypto.HMAC256, 'function');
	assert.type(crypto.HMAC384, 'function');
	assert.type(crypto.HMAC512, 'function');
});

HMAC('should return ArrayBuffer', async () => {
	let output = await crypto.HMAC('SHA-1', 'foo', 'bar');
	assert.instance(output, ArrayBuffer);
});

HMAC('should produce expected output :: SHA-1', async ctx => {
	await ctx.compare('SHA-1', 'hello', 'world');
	await ctx.compare('SHA-1', 'world', 'world');

	await ctx.compare('SHA-1', 'foo … bar', 'password');
	await ctx.compare('SHA-1', '😂', 'password');
});

HMAC('should produce expected output :: SHA-256', async ctx => {
	await ctx.compare('SHA-256', 'hello', 'world');
	await ctx.compare('SHA-256', 'world', 'world');

	await ctx.compare('SHA-256', 'foo … bar', 'password');
	await ctx.compare('SHA-256', '😂', 'password');
});

HMAC('should produce expected output :: SHA-384', async ctx => {
	await ctx.compare('SHA-384', 'hello', 'world');
	await ctx.compare('SHA-384', 'world', 'world');

	await ctx.compare('SHA-384', 'foo … bar', 'password');
	await ctx.compare('SHA-384', '😂', 'password');
});

HMAC('should produce expected output :: SHA-512', async ctx => {
	await ctx.compare('SHA-512', 'hello', 'world');
	await ctx.compare('SHA-512', 'world', 'world');

	await ctx.compare('SHA-512', 'foo … bar', 'password');
	await ctx.compare('SHA-512', '😂', 'password');
});

HMAC.run();
