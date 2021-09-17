type SHA = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
type AES = 'AES-CTR' | 'AES-CBC' | 'AES-GCM' | 'AES-KW';
type NIST = 'P-256' | 'P-384' | 'P-521';

/**
 * Generate a MD5 hash for an input message.
 * @NOTE Only supported by Cloudflare Workers!
 */
export function MD5(message: string): Promise<string>;

export function SHA1(message: string): Promise<string>;
export function SHA256(message: string): Promise<string>;
export function SHA384(message: string): Promise<string>;
export function SHA512(message: string): Promise<string>;

export namespace Algorithms {
	/**
	 * @NOTE Only Cloudflare Workers supports "MD5" as a WebCrypto digest.
	 */
	type Digest = SHA | 'MD5';

	type Keying =
		| { name: 'RSASSA-PKCS1-v1_5'; hash: Digest }
		| { name: 'RSA-OAEP'; hash: Digest }
		| { name: 'RSA-PSS'; hash: Digest }
		| { name: 'ECDSA'; namedCurve: NIST }
		| { name: 'ECDH'; namedCurve: NIST }
		| { name: 'HMAC'; hash: Digest; length?: number }
		| { name: AES } | AES | 'PBKDF2' | 'HKDF';

	type Signing =
		| { name: 'RSASSA-PKCS1-v1_5' } | 'RSASSA-PKCS1-v1_5'
		| { name: 'RSA-PSS'; saltLength: number }
		| { name: 'ECDSA'; hash: Digest }
		| { name: 'HMAC' } | 'HMAC';
}

export function digest(algorithm: Algorithms.Digest, message: string): Promise<string>;

/**
 * Generate a `CryptoKey` based on the raw `secret` value.
 * @NOTE Method wraps `crypto.subtle.importKey` internally.
 */
export function keyload(algo: Algorithms.Keying, secret: string, scopes: KeyUsage[]): Promise<CryptoKey>;

/**
 * Generate a `CryptoKey` without a base value.
 * @NOTE Method wraps `crypto.subtle.generateKey` internally.
 */
export function keygen(algo: Algorithms.Keying, scopes: KeyUsage[], extractable?: boolean): Promise<CryptoKey|CryptoKeyPair>;

/**
 * Generate a digital signature of a `payload` using the specified algorithm and cryptokey.
 */
export function sign(algo: Algorithms.Signing, key: CryptoKey, payload: string): Promise<ArrayBuffer>;

/**
 * Verify the digital signature of a `payload` using the specified algorithm and cryptokey.
 */
export function verify(algo: Algorithms.Signing, key: CryptoKey, payload: string, signature: ArrayBuffer): Promise<boolean>;

/**
 * Convenient alias for all TypedArray classes
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
 */
export type TypedArray = Int8Array | Uint8Array | Uint8ClampedArray | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array | BigInt64Array | BigUint64Array;

/**
 * A constant-time check if `a` and `b` are equal.
 * Does not leak timing information, which would allow an attacker to guess one of the values.
 * @see https://nodejs.org/dist/latest-v14.x/docs/api/crypto.html#crypto_crypto_timingsafeequal_a_b
 */
export function timingSafeEqual<T extends TypedArray>(a: T, b: T): boolean;

/**
 * Apply the PBKDF2 function to an input using a salt and derivation parameters.
 * @see https://en.wikipedia.org/wiki/PBKDF2
 * @param {SHA}    digest   The hashing function to use.
 * @param {string} password The input value to protect.
 * @param {string} salt     The cryptographic salt.
 * @param {number} iters    The number of hashing iterations.
 * @param {number} length   The desired number of bits to derive.
 */
export function PBKDF2(digest: Algorithms.Digest, password: string, salt: string, iters: number, length: number): Promise<ArrayBuffer>;

/**
 * Hash-based message authentication code (HMAC).
 * HMAC is used to ensure both integrity and authentication.
 */
export function HMAC(hash: Algorithms.Digest, secret: string, data: string): Promise<ArrayBuffer>;

export function HMAC256(secret: string, message: string): Promise<ArrayBuffer>;
export function HMAC384(secret: string, message: string): Promise<ArrayBuffer>;
export function HMAC512(secret: string, message: string): Promise<ArrayBuffer>;
