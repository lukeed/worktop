import * as crypto from 'worktop/crypto';
import { toHEX } from 'worktop/utils';

declare let i8: Int8Array;
declare let u8: Uint8Array;
declare let u32: Uint32Array;
declare let ab: ArrayBuffer;
declare let dv: DataView;

/**
 * timingSafeEqual
 */

assert<Function>(crypto.timingSafeEqual);
assert<boolean>(crypto.timingSafeEqual(u8, u8));

crypto.timingSafeEqual(u32, u32);

// @ts-expect-error - DataView
crypto.timingSafeEqual(u8, dv);

// @ts-expect-error - ArrayBuffer
crypto.timingSafeEqual(ab, i8);

// @ts-expect-error - Mismatch
crypto.timingSafeEqual(u8, u32);

/**
 * digest
 */

// @ts-expect-error
crypto.digest('foobar', 'message');

assert<Promise<string>>(
	crypto.digest('SHA-1', 'foobar')
);

assert<string>(
	await crypto.digest('SHA-1', 'foobar')
);

/**
 * HMAC
 */

// @ts-expect-error
crypto.HMAC('foobar', 'secret', 'data');

crypto.HMAC('SHA-1', 'secret', 'data');
crypto.HMAC('SHA-256', 'secret', 'data');
crypto.HMAC('SHA-384', 'secret', 'data');
crypto.HMAC('SHA-512', 'secret', 'data');

assert<Promise<ArrayBuffer>>(
	crypto.HMAC('SHA-1', 'secret', 'data')
);

assert<ArrayBuffer>(
	await crypto.HMAC('SHA-1', 'secret', 'data')
);

assert<string>(
	await crypto.HMAC('SHA-256', 'secret', 'data').then(toHEX)
);

/**
 * PBKDF2
 */

// @ts-expect-error
crypto.PBKDF2('foobar', 'secret', 'salt', 1e3, 32);

crypto.PBKDF2('SHA-1', 'secret', 'salt', 1e3, 32);
crypto.PBKDF2('SHA-256', 'secret', 'salt', 1e3, 32);
crypto.PBKDF2('SHA-384', 'secret', 'salt', 10e3, 32);
crypto.PBKDF2('SHA-512', 'secret', 'salt', 1e3, 32);

assert<Promise<ArrayBuffer>>(
	crypto.PBKDF2('SHA-512', 'secret', 'salt', 1e3, 32)
);

assert<ArrayBuffer>(
	await crypto.PBKDF2('SHA-512', 'secret', 'salt', 1e3, 32)
);

assert<string>(
	await crypto.PBKDF2('SHA-1', 'secret', 'salt', 1e3, 32).then(toHEX)
);
