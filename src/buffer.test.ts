import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as buffer from './buffer';

// ---

const HEX = suite('HEX');

HEX('should be an Array', () => {
	assert.instance(buffer.HEX, Array);
});

HEX('should have 256 values', () => {
	assert.is(buffer.HEX.length, 256);
});

HEX('should have correct values', () => {
	assert.is(buffer.HEX[0], '00');
	assert.is(buffer.HEX[10], '0a');
	assert.is(buffer.HEX[255], 'ff');
	assert.is(buffer.HEX[256], undefined);

	for (let i = 0; i < 256; i++) {
		assert.is(buffer.HEX[i], i.toString(16).padStart(2, '0'));
	}
});

HEX.run();

// ---

const toHEX = suite('toHEX');

toHEX('should be a function', () => {
	assert.type(buffer.toHEX, 'function');
});

toHEX('should return a string', () => {
	const input = new Uint8Array;
	assert.type(buffer.toHEX(input), 'string');
	assert.type(buffer.toHEX(input.buffer), 'string');
});

toHEX('should convert input HEX string', () => {
	const input = buffer.encode('hello world');
	assert.is(buffer.toHEX(input), '68656c6c6f20776f726c64');
	assert.is(buffer.toHEX(input.buffer), '68656c6c6f20776f726c64');
});

toHEX.run();

// ---

const viaHEX = suite('viaHEX');

viaHEX('should be a function', () => {
	assert.type(buffer.viaHEX, 'function');
});

viaHEX('should return a `Uint8Array` instance', () => {
	assert.instance(buffer.viaHEX(''), Uint8Array);
	assert.instance(buffer.viaHEX('input'), Uint8Array);
});

viaHEX('should decode HEX string', () => {
	const expects = buffer.encode('hello world');
	const output = buffer.viaHEX('68656c6c6f20776f726c64');
	assert.equal(output, expects);

	assert.is(
		buffer.decode(output),
		'hello world'
	);
});

viaHEX('should preserve emoji (utf8) content', () => {
	const output = buffer.viaHEX('54686520717569636b2062726f776e20f09fa68a206a756d7073206f766572203133206c617a7920f09f90b62e');

	assert.is(
		new TextDecoder('utf8').decode(output),
		'The quick brown 🦊 jumps over 13 lazy 🐶.'
	);
});

viaHEX.run();

// ---

const toUTF8 = suite('toUTF8');

toUTF8('should be a function', () => {
	assert.type(buffer.toUTF8, 'function');
});

toUTF8('should return a string', () => {
	let output = buffer.toUTF8(new Uint8Array);
	assert.type(output, 'string');
	assert.is(output, '');
});

toUTF8('should produce "utf8" string values :: raw', () => {
	let input = new Uint8Array([104, 101, 108, 108, 111]);
	assert.is(buffer.toUTF8(input), 'hello');

	input = new Uint8Array([119, 111, 114, 108, 100]);
	assert.is(buffer.toUTF8(input), 'world',);

	input = new Uint8Array([]);
	assert.is(buffer.toUTF8(input), '',);

	input = new Uint8Array([32]);
	assert.is(buffer.toUTF8(input), ' ',);

	input = new Uint8Array([226, 130, 172]);
	assert.is(buffer.toUTF8(input), '€',);
});

toUTF8('should produce "utf8" string values :: echo', () => {
	let input = Buffer.from('ÀÈÌÒÙ');
	let output = buffer.toUTF8(input);
	assert.is(output, input.toString('utf8'));
	assert.is(output, 'ÀÈÌÒÙ');

	input = Buffer.from('😀');
	output = buffer.toUTF8(input);
	assert.is(output, input.toString('utf8'));
	assert.is(output, '😀');
});

toUTF8.run();

// ---

const viaUTF8 = suite('viaUTF8');

viaUTF8('should be a function', () => {
	assert.type(buffer.viaUTF8, 'function');
});

viaUTF8('should return `Uint8Array` output', () => {
	assert.instance(buffer.viaUTF8(''), Uint8Array);
});

viaUTF8('should return `Uint8Array` values :: raw', () => {
	let output = new Uint8Array([104, 101, 108, 108, 111]);
	assert.equal(buffer.viaUTF8('hello'), output);

	output = new Uint8Array([119, 111, 114, 108, 100]);
	assert.equal(buffer.viaUTF8('world'), output);

	output = new Uint8Array([]);
	assert.equal(buffer.viaUTF8(''), output);

	output = new Uint8Array([32]);
	assert.equal(buffer.viaUTF8(' '), output);

	output = new Uint8Array([226, 130, 172]);
	assert.equal(buffer.viaUTF8('€'), output);
});

viaUTF8('should return `Uint8Array` values :: echo', () => {
	let input = 'ÀÈÌÒÙ';
	let raw = Buffer.from(input, 'utf8');
	assert.equal(buffer.viaUTF8(input), new Uint8Array(raw));

	input = '😀';
	raw = Buffer.from(input, 'utf8');
	assert.equal(buffer.viaUTF8(input), new Uint8Array(raw));
});

viaUTF8.run();
