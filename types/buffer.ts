import * as buffer from 'worktop/buffer';

declare let u8: Uint8Array;
declare let raw: ArrayBuffer;

/**
 * encode
 */

// @ts-expect-error
buffer.encode(raw);

// @ts-expect-error
buffer.encode(u8);

// @ts-expect-error
buffer.encode([1, 2, 3]);

assert<Uint8Array>(buffer.encode('foo'));

/**
 * decode
 */

// @ts-expect-error
buffer.decode('foobar');

// @ts-expect-error
buffer.decode([1, 2, 3]);

assert<string>(buffer.decode(u8));
assert<string>(buffer.decode(raw));

/**
 * HEX
 */

// @ts-expect-error
HEX.push('hello', 'world');

// @ts-expect-error
HEX[10] = 'cannot do this';

assert<readonly string[]>(buffer.HEX);

/**
 * toHEX
 */

// @ts-expect-error
buffer.toHEX('foobar');

// @ts-expect-error
buffer.toHEX([1, 2, 3]);

assert<string>(buffer.toHEX(u8));
assert<string>(buffer.toHEX(raw));

/**
 * viaHEX
 */

// @ts-expect-error
buffer.viaHEX(raw);

// @ts-expect-error
buffer.viaHEX(u8);

// @ts-expect-error
buffer.viaHEX([1, 2, 3]);

assert<Uint8Array>(buffer.viaHEX('foo'));

/**
 * viaUTF8
 */

// @ts-expect-error
buffer.viaUTF8(raw);

// @ts-expect-error
buffer.viaUTF8(u8);

// @ts-expect-error
buffer.viaUTF8([1, 2, 3]);

assert<Uint8Array>(buffer.viaUTF8('foo'));

/**
 * toUTF8
 */

// @ts-expect-error
buffer.toUTF8('foobar');

// @ts-expect-error
buffer.toUTF8([1, 2, 3]);

assert<string>(buffer.toUTF8(u8));
assert<string>(buffer.toUTF8(raw));