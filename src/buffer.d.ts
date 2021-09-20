/**
 * Encode a "binary" string into an Uint8Array.
 * @encoding "binary"
 * @alias viaBinary
 */
export function encode(input: string): Uint8Array;

/**
 * Decode an ArrayBuffer into a "binary" string.
 * @encoding "binary"
 * @alias toBinary
 */
export function decode(buffer: ArrayBuffer): string;

/**
 * Encode a "binary" string into an Uint8Array.
 * @encoding "binary"
 * @alias encode
 */
export function viaBinary(input: string): Uint8Array;

/**
 * Decode an ArrayBuffer into a "binary" string.
 * @encoding "binary"
 * @alias decode
 */
export function toBinary(buffer: ArrayBuffer): string;
