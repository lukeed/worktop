import { suite } from 'uvu';
import * as assert from 'uvu/assert';
import * as buffer from './buffer';

// ---

const decode = suite('decode');

decode('should be a function', () => {
	assert.type(buffer.decode, 'function');
});

decode('should return a string', () => {
	let input = new Uint8Array;
	assert.type(buffer.decode(input), 'string');
	assert.type(buffer.decode(input.buffer), 'string');
});

decode('should convert into "binary" string', () => {
	let view = new TextEncoder().encode('ÀÈÌÒÙ');
	let binary = 'Ã\x80Ã\x88Ã\x8CÃ\x92Ã\x99';

	assert.is(buffer.decode(view), binary);
	assert.is(buffer.decode(view.buffer), binary);

	assert.is(Buffer.from('ÀÈÌÒÙ').toString('binary'), binary);
	assert.is(Buffer.from('ÀÈÌÒÙ').toString('ascii'), 'C\x00C\bC\fC\x12C\x19');
	assert.is(Buffer.from('ÀÈÌÒÙ').toString('utf8'), 'ÀÈÌÒÙ');

	assert.is(new TextDecoder('utf8').decode(view), 'ÀÈÌÒÙ');
	assert.is(new TextDecoder('ascii').decode(view), 'Ã€ÃˆÃŒÃ’Ã™');
});

decode.run();

// ---

const encode = suite('encode');

encode('should be a function', () => {
	assert.type(buffer.encode, 'function');
});

encode('should return `Uint8Array` output', () => {
	assert.instance(buffer.encode(''), Uint8Array);
});

encode('should return encoded values :: binary', () => {
	assert.equal(
		buffer.encode('hello'),
		new Uint8Array([104, 101, 108, 108, 111])
	);

	assert.equal(
		buffer.encode('world'),
		new Uint8Array([119, 111, 114, 108, 100])
	);

	assert.equal(
		buffer.encode(''),
		new Uint8Array([])
	);

	assert.equal(
		buffer.encode(' '),
		new Uint8Array([32])
	);

	assert.equal(
		buffer.encode('€'),
		new Uint8Array([172]),
	);

	assert.equal(
		buffer.encode('ÀÈÌÒÙ'),
		new Uint8Array([192, 200, 204, 210, 217])
	);
});

encode('should return a `Uint8Array` instance', () => {
	assert.instance(buffer.encode(''), Uint8Array);
	assert.instance(buffer.encode('input'), Uint8Array);
});

encode.run();

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
	assert.type(buffer.asHEX, 'function');
});

viaHEX('should return a `Uint8Array` instance', () => {
	assert.instance(buffer.asHEX(''), Uint8Array);
	assert.instance(buffer.asHEX('input'), Uint8Array);
});

viaHEX('should decode HEX string', () => {
	const expects = buffer.encode('hello world');
	const output = buffer.asHEX('68656c6c6f20776f726c64');
	assert.equal(output, expects);

	assert.is(
		buffer.decode(output),
		'hello world'
	);
});

viaHEX('should preserve emoji (utf8) content', () => {
	const output = buffer.asHEX('54686520717569636b2062726f776e20f09fa68a206a756d7073206f766572203133206c617a7920f09f90b62e');

	assert.is(
		new TextDecoder('utf8').decode(output),
		'The quick brown 🦊 jumps over 13 lazy 🐶.'
	);
});

viaHEX.run();

// ---

const Encoder = suite('Encoder');

Encoder('should be a `TextEncoder` instance', () => {
	assert.instance(buffer.Encoder, TextEncoder);
});

Encoder('should have the `encode` method', () => {
	assert.type(buffer.Encoder.encode, 'function');
});

Encoder('should produce `Uint8Array` values', () => {
	assert.instance(buffer.Encoder.encode(''), Uint8Array);
});

Encoder('should produce `Uint8Array` with UTF-8 encoded text', () => {
	let output = buffer.Encoder.encode('ÀÈÌÒÙ');
	assert.not.equal(output, buffer.encode('ÀÈÌÒÙ'));
	assert.equal(output, new Uint8Array([195, 128, 195, 136, 195, 140, 195, 146, 195, 153]));

	output = buffer.Encoder.encode('€');
	assert.not.equal(output, buffer.encode('€'));
	assert.equal(output, new Uint8Array([226, 130, 172]));
});

Encoder.run();

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
	assert.is(buffer.toUTF8(input), 'world');

	input = new Uint8Array([]);
	assert.is(buffer.toUTF8(input), '');

	input = new Uint8Array([32]);
	assert.is(buffer.toUTF8(input), ' ');

	input = new Uint8Array([226, 130, 172]);
	assert.is(buffer.toUTF8(input), '€');
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

const asUTF8 = suite('asUTF8');

asUTF8('should be a function', () => {
	assert.type(buffer.asUTF8, 'function');
});

asUTF8('should return `Uint8Array` output', () => {
	assert.instance(buffer.asUTF8(''), Uint8Array);
});

asUTF8('should return `Uint8Array` values :: raw', () => {
	let output = new Uint8Array([104, 101, 108, 108, 111]);
	assert.equal(buffer.asUTF8('hello'), output);

	output = new Uint8Array([119, 111, 114, 108, 100]);
	assert.equal(buffer.asUTF8('world'), output);

	output = new Uint8Array([]);
	assert.equal(buffer.asUTF8(''), output);

	output = new Uint8Array([32]);
	assert.equal(buffer.asUTF8(' '), output);

	output = new Uint8Array([226, 130, 172]);
	assert.equal(buffer.asUTF8('€'), output);
	assert.not.equal(buffer.asBinary('€'), output);
});

asUTF8('should return `Uint8Array` values :: echo', () => {
	let input = 'ÀÈÌÒÙ';
	let raw = Buffer.from(input, 'utf8');
	assert.equal(buffer.asUTF8(input), new Uint8Array(raw));

	input = '😀';
	raw = Buffer.from(input, 'utf8');
	assert.equal(buffer.asUTF8(input), new Uint8Array(raw));
});

asUTF8.run();

// ---

const toASCII = suite('toASCII');

toASCII('should be a function', () => {
	assert.type(buffer.toASCII, 'function');
});

toASCII('should be limited to the ASCII range', () => {
	let u8 = buffer.asUTF8('€');
	assert.equal(u8, new Uint8Array([226, 130, 172]));

	assert.is(buffer.toUTF8(u8), '€');
	assert.is(buffer.toASCII(u8), 'b\x02,');

	let decoder = new TextDecoder('ascii');
	assert.is(decoder.decode(u8), 'â‚¬'); // wtf

	let bin = buffer.asBinary('€');
	assert.is.not(buffer.toASCII(bin), 'b\x02,');
});

toASCII.run();

// ---

const from = suite<{ list: BufferEncoding[] }>('from', {
	list: ['ascii', 'utf8', 'utf-8', 'utf16le', 'ucs2', 'ucs-2', 'base64', 'base64url', 'latin1', 'binary', 'hex']
});

from('should be a function', () => {
	assert.type(buffer.from, 'function');
});

from('should default to "utf8" encoding', () => {
	let foo = buffer.from('foobar');
	let bar = buffer.from('foobar', 'utf8');
	assert.equal(foo, bar);
});

from('should alias "utf8" and "utf-8" values', () => {
	let foo = buffer.from('foobar', 'utf-8');
	let bar = buffer.from('foobar', 'utf8');
	assert.equal(foo, bar);
});

from('should parse "utf8" as UTF-8 text', () => {
	let foo = buffer.from('foobar', 'utf-8');
	let bar = Buffer.from('foobar', 'utf-8');
	assert.equal(
		new Uint8Array(foo),
		new Uint8Array(bar),
	);
});

from('should convert "utf8" to other encodings', ctx => {
	let mock = buffer.from('ÀÈÌÒÙ');
	let native = Buffer.from('ÀÈÌÒÙ');

	ctx.list.forEach(str => {
		assert.is(
			mock.toString(str),
			native.toString(str),
			`utf8 => ${str}`
		);
	});
});

from('should convert "base64" to other encodings', ctx => {
	let mock = buffer.from('Zm9vYmFy', 'base64');
	let native = Buffer.from('Zm9vYmFy', 'base64');

	ctx.list.forEach(str => {
		assert.is(
			mock.toString(str),
			native.toString(str),
			`base64 => ${str}`
		);
	});
});

from('should convert "hex" to other encodings', ctx => {
	let mock = buffer.from('666f6f626172', 'hex');
	let native = Buffer.from('666f6f626172', 'hex');

	ctx.list.forEach(str => {
		assert.is(
			mock.toString(str),
			native.toString(str),
			`hex => ${str}`
		);
	});
});

from('should convert "utf16le" to other encodings', ctx => {
	let mock = buffer.from('foobar', 'utf16le');
	let native = Buffer.from('foobar', 'utf16le');

	ctx.list.forEach(str => {
		assert.is(
			mock.toString(str),
			native.toString(str),
			`utf16le => ${str}`
		);
	});
});

from('should convert "binary" to other encodings', ctx => {
	let mock = buffer.from('ÀÈÌÒÙ', 'binary');
	let native = Buffer.from('ÀÈÌÒÙ', 'binary');

	ctx.list.forEach(str => {
		assert.ok(
			mock.toString(str).startsWith(
				native.toString(str)
			),
			`binary => ${str}`
		);
	});
});

from.run();
