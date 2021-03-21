/**
 * All 256 hexadecimal pairs
 * @NOTE Maximum index is `255`
 */
export const HEX: readonly string[];

/**
 * Generate a unique string of `len` length.
 * @NOTE Relies on `crypto` to produce cryptographically secure (CSPRNG) values.
 * @param {number} [len] The desired length (defaults to `11`)
 */
export function uid(len?: number): string;

/**
 * Generate a new UUID.V4 value.
 * @NOTE Relies on `crypto` to produce cryptographically secure (CSPRNG) values.
 */
export function uuid(): string;

/**
 * Reusable `TextEncoder` instance.
 */
export const Encoder: TextEncoder;

/**
 * Reusable `TextDecoder` instance.
 */
export const Decoder: TextDecoder;

/**
 * Calculate the length (in bytes) of an input string.
 * @param {string} [input]
 */
export function byteLength(input?: string): number;
