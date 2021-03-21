/**
 * All 256 hexadecimal pairs
 * @NOTE Maximum index is `255`
 */
export const HEX: readonly string[];

/**
 * Convert an `ArrayBuffer` to a hexadecimal string.
 * @param {ArrayBuffer} input
 */
export function toHEX(input: ArrayBuffer): string;

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
 * @NOTE Initialized with UTF-8 encoding.
 */
export const Decoder: TextDecoder;

/**
 * Encode a string as an `Uint8Array` containing UTF-8 encoded text.
 * @param {string} input
 */
export function encode(input: string): Uint8Array;

/**
 * Decode a string from an `ArrayBuffer` or an `ArrayBufferView` input.
 * @param {string} input
 * @param {boolean} [isStream] Additional data will follow in subsequent calls to decode.
 */
export function decode(input: ArrayBufferView | ArrayBuffer, isStream?: boolean): string;


/**
 * Calculate the length (in bytes) of an input string.
 * @param {string} [input]
 */
export function byteLength(input?: string): number;
