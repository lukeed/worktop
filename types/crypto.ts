import * as crypto from 'worktop/crypto';

declare let i8: Int8Array;
declare let u8: Uint8Array;
declare let u32: Uint32Array;
declare let ab: ArrayBuffer;
declare let dv: DataView;

assert<Function>(crypto.timingSafeEqual);
assert<boolean>(crypto.timingSafeEqual(u8, u8));

crypto.timingSafeEqual(u32, u32);

// @ts-expect-error - DataView
crypto.timingSafeEqual(u8, dv);

// @ts-expect-error - ArrayBuffer
crypto.timingSafeEqual(ab, i8);

// @ts-expect-error - Mismatch
crypto.timingSafeEqual(u8, u32);
