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

/**
 * All 256 hexadecimal pairs
 * @NOTE Maximum index is `255`
 */
export const HEX: readonly string[];

/**
 * Decode an ArrayBuffer into a hexadecimal string.
 * @encoding "hex"
 */
export function toHEX(buffer: ArrayBuffer): string;

/**
 * Convert a hexadecimal string into an `Uint8Array` instance.
 * @encoding "hex"
 */
export function viaHEX(input: string): Uint8Array;

/**
 * Decode an ArrayBuffer into an "utf8" string
 * @encoding "utf8"
 */
export function toUTF8(buffer: ArrayBuffer): string;

/**
 * Encode an "utf8" string into an Uint8Array.
 * @encoding "utf8"
 */
export function viaUTF8(input: string): Uint8Array;
