export type Promisable<T> = Promise<T> | T;
export type Dict<T> = Record<string, T>;
export type Arrayable<T> = T[] | T;
export type Strict<T> = {
	[K in keyof T as {} extends Record<K, 1> ? never : K]: T[K];
};

declare global {
	interface Crypto {
		randomUUID(): string;
	}
}

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
 * Calculate the length (in bytes) of an input string.
 * @param {string} [input]
 */
export function byteLength(input?: string): number;


/**
 * Parse a `Request` or `Response` body according to its `Content-Type` header.
 * @NOTE Converts `FormData` into an object.
 */
export function body<T>(input: Request | Response): Promise<T|void>;


/**
 * Converts an `Iterable` into an object.
 * @NOTE Like `Object.fromEntries`, but can collect multiple values for same key.
 */
export function toObject<T>(iter: Iterable<[string, T]>): Dict<Arrayable<T>>;
