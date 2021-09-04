import { suite } from 'uvu';
import { promisify } from 'util';
import * as assert from 'uvu/assert';
import { createHash, pbkdf2 } from 'crypto';
import * as crypto from './crypto';
import { toHEX } from './utils';

/**
 * TODO(Node 16) SubtleCrypto
 * require(crypto).webcrypto.subtle
 * @see https://nodejs.org/api/webcrypto.html#webcrypto_class_subtlecrypto
 */

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

const SHA1 = suite('SHA1');

SHA1('should be a function', () => {
	assert.type(crypto.SHA1, 'function');
});

SHA1('should return correct values as hexstrings', async () => {
	assert.is(
		await crypto.SHA1(''),
		createHash('sha1').update('').digest('hex'),
		'~> da39a3ee5e6b4b0d3255bfef95601890afd80709'
	);

	assert.is(
		await crypto.SHA1('hello'),
		createHash('sha1').update('hello').digest('hex'),
		'~> aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d'
	);

	assert.is(
		await crypto.SHA1('hello1'),
		createHash('sha1').update('hello1').digest('hex'),
		'~> 88fdd585121a4ccb3d1540527aee53a77c77abb8'
	);

	assert.is(
		await crypto.SHA1('hello world'),
		createHash('sha1').update('hello world').digest('hex'),
		'~> 2aae6c35c94fcfb415dbe95f408b9ce91ee846ed'
	);
});

SHA1.run();

// ---

const SHA256 = suite('SHA256');

SHA256('should be a function', () => {
	assert.type(crypto.SHA256, 'function');
});

SHA256('should return correct values as hexstrings', async () => {
	assert.is(
		await crypto.SHA256(''),
		createHash('sha256').update('').digest('hex'),
		'~> e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
	);

	assert.is(
		await crypto.SHA256('hello'),
		createHash('sha256').update('hello').digest('hex'),
		'~> 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
	);

	assert.is(
		await crypto.SHA256('hello1'),
		createHash('sha256').update('hello1').digest('hex'),
		'~> 91e9240f415223982edc345532630710e94a7f52cd5f48f5ee1afc555078f0ab'
	);

	assert.is(
		await crypto.SHA256('hello world'),
		createHash('sha256').update('hello world').digest('hex'),
		'~> b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9'
	);
});

SHA256.run();

// ---

const SHA384 = suite('SHA384');

SHA384('should be a function', () => {
	assert.type(crypto.SHA384, 'function');
});

SHA384('should return correct values as hexstrings', async () => {
	assert.is(
		await crypto.SHA384(''),
		createHash('sha384').update('').digest('hex'),
		'~> 38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b'
	);

	assert.is(
		await crypto.SHA384('hello'),
		createHash('sha384').update('hello').digest('hex'),
		'~> 59e1748777448c69de6b800d7a33bbfb9ff1b463e44354c3553bcdb9c666fa90125a3c79f90397bdf5f6a13de828684f'
	);

	assert.is(
		await crypto.SHA384('hello1'),
		createHash('sha384').update('hello1').digest('hex'),
		'~> 7a79ada28c7218353974345bfc7c2c463577219dc4ecc155341e770ce235634c7f5224bf586e51fe6d890cfe41e1c59a'
	);

	assert.is(
		await crypto.SHA384('hello world'),
		createHash('sha384').update('hello world').digest('hex'),
		'~> fdbd8e75a67f29f701a4e040385e2e23986303ea10239211af907fcbb83578b3e417cb71ce646efd0819dd8c088de1bd'
	);
});

SHA384.run();

// ---

const SHA512 = suite('SHA512');

SHA512('should be a function', () => {
	assert.type(crypto.SHA512, 'function');
});

SHA512('should return correct values as hexstrings', async () => {
	assert.is(
		await crypto.SHA512(''),
		createHash('sha512').update('').digest('hex'),
		'~> cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e'
	);

	assert.is(
		await crypto.SHA512('hello'),
		createHash('sha512').update('hello').digest('hex'),
		'~> 9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72323c3d99ba5c11d7c7acc6e14b8c5da0c4663475c2e5c3adef46f73bcdec043'
	);

	assert.is(
		await crypto.SHA512('hello1'),
		createHash('sha512').update('hello1').digest('hex'),
		'~> 1dabfeadb6451e4903649fe6efec8ecda6b40e5ba99f73dfb5510956df496ecb1ebb625b9376bbcef223b354481633e9b977872aef979478e6451975e714c31f'
	);

	assert.is(
		await crypto.SHA512('hello world'),
		createHash('sha512').update('hello world').digest('hex'),
		'~> 309ecc489c12d6eb4cc40f50c902f2b4d0ed77ee511a7c7a9bcd3ca86d4cd86f989dd35bc5ff499670da34255b45b0cfd830e81f605dcf7dc5542e93ae9cd76f'
	);
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
	native: promisify(pbkdf2)
});

PBKDF2('should be a function', () => {
	assert.type(crypto.PBKDF2, 'function');
});

// @see https://nodejs.org/api/crypto.html#crypto_crypto_pbkdf2_password_salt_iterations_keylen_digest_callback
PBKDF2('should produce expected output', async ctx => {
	assert.is(
		await crypto.PBKDF2('SHA-512', 'secret', 'salt', 100e3, 64).then(toHEX),
		(await ctx.native('secret', 'salt', 100e3, 64, 'sha512')).toString('hex'),
		'~> 3745e482c6e0ade35da10139e797157f4a5da669dad7d5da88ef87e47471cc47ed941c7ad618e827304f083f8707f12b7cfdd5f489b782f10cc269e3c08d59ae'
	)
});

PBKDF2.run();
