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
