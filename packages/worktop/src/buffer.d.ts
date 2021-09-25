/**
 * Encode a "binary" string into an Uint8Array.
 * @encoding "binary"
 * @alias `asBinary`
 */
export function encode(input: string): Uint8Array;

/**
 * Decode an ArrayBuffer into a "binary" string.
 * @encoding "binary"
 * @alias `toBinary`
 */
export function decode(buffer: ArrayBuffer): string;

/**
 * Encode a "binary" string into an Uint8Array.
 * @encoding "binary"
 * @alias `encode`
 */
export function asBinary(input: string): Uint8Array;

/**
 * Decode an ArrayBuffer into a "binary" string.
 * @encoding "binary"
 * @alias `decode`
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
export function asHEX(input: string): Uint8Array;

/**
 * Reusable `TextEncoder` instance.
 * @encoding "utf8"
 */
export const Encoder: TextEncoder;

/**
 * Decode an ArrayBuffer into an "utf8" string
 * @encoding "utf8"
 */
export function toUTF8(buffer: ArrayBuffer): string;

/**
 * Parse a string as a `Uint8Array` containing UTF-8 encoded text.
 * @alias new TextEncoder().encode(input);
 * @encoding "utf8"
 */
export function asUTF8(input: string): Uint8Array;

/**
 * Convert an Uint8Array into an "ascii" string
 * @encoding "ascii"
 */
export function toASCII(buffer: Uint8Array): string;

/**
 * Parse a PEM key (public or private) string into an Uint8Array.
 * @encoding "binary"
 */
export function asPEM(input: string): Uint8Array;

/**
 * All Node.js Buffer encodings.
 * @reference [Character encodings](https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings)
 * @NOTE Cloudflare Workers does NOT support: "utf16le", "ucs2", "ucs-2"
 */
export type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'base64url' | 'latin1' | 'binary' | 'hex';

/**
 * Custom `Buffer` type with dynamic `toString` encoder.
 */
export type Buffer = Uint8Array & {
	/**
	 * Decodes the `Uint8Array|Buffer` into a string with the specified character encoding.
	 * @param {BufferEncoding} [encoding] The new character encoding to use. Default: "utf8"
	 * @reference [`buf.toString()`](https://nodejs.org/api/buffer.html#buffer_buf_tostring_encoding_start_end)
	 */
	toString(encoding?: BufferEncoding): string;
};

/**
 * Create a new `Uint8Array|Buffer` from a string with the given encoding.
 * @param {BufferEncoding} [encoding] The `input` encoding. Default: "utf8"
 * @reference [`Buffer.from`](https://nodejs.org/api/buffer.html#buffer_static_method_buffer_from_string_encoding)
 */
export function from(input: string, encoding?: BufferEncoding): Buffer;
