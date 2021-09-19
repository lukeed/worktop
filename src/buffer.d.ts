/**
 * Encode a string into an Uint8Array.
 * @encoding "binary"
 */
export function encode(input: string): Uint8Array;

/**
 * Decode an ArrayBuffer into a string.
 * @encoding "binary"
 */
export function decode(buffer: ArrayBuffer): string;
