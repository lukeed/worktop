declare global {
	interface Crypto {
		randomUUID(): string;
	}
}

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
 * Decode a hexadecimal string into an `Uint8Array` instance.
 * @NOTE Pass output through `decode()` for string conversion.
 * @param {string} input
 */
export function viaHEX(input: string): Uint8Array;

/**
 * Generate a unique string of `len` length.
 * @NOTE Relies on `crypto` to produce cryptographically secure (CSPRNG) values.
 * @param {number} [len] The desired length (defaults to `11`)
 */
export function uid<N extends number = 11>(len?: N): UID<N>;
export type UID<N extends number> = { 0: string; length: N } & string;

/**
 * Generate a new UUID.V4 value.
 * @NOTE Relies on `crypto` to produce cryptographically secure (CSPRNG) values.
 */
export function uuid(): UUID;
export type UUID = { 0: string; length: 36 } & string;

/**
 * Generate a universally unique lexicographically sortable identifier (ulid).
 * @NOTE Relies on `crypto` to produce cryptographically secure (CSPRNG) values.
 * @see https://github.com/ulid/spec
 */
export function ulid(): ULID;
export type ULID = { 0: string; length: 26 } & string;

/**
 * Generate a specified number of cryptographically strong random values.
 * @NOTE Throws a `QuotaExceededError` error if `length` exceeds 65,536 bytes.
 */
export function randomize(length: number): Uint8Array;

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
 * Decode a UTF-8 text string from an `ArrayBuffer` or an `ArrayBufferView` input.
 * @param {string} input
 * @param {boolean} [isStream] Additional data will follow in subsequent calls to decode.
 */
export function decode(input: ArrayBufferView | ArrayBuffer, isStream?: boolean): string;

/**
 * Calculate the length (in bytes) of an input string.
 * @param {string} [input]
 */
export function byteLength(input?: string): number;
