type SHA = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
type AES = 'AES-CTR' | 'AES-CBC' | 'AES-GCM' | 'AES-KW';
type NIST = 'P-256' | 'P-384' | 'P-521';

export function digest(algorithm: SHA, message: string): Promise<string>;

export function SHA1(message: string): Promise<string>;
export function SHA256(message: string): Promise<string>;
export function SHA384(message: string): Promise<string>;
export function SHA512(message: string): Promise<string>;

export namespace Algorithms {
	type Digest = SHA;

	type Keying =
		| { name: 'RSASSA-PKCS1-v1_5'; hash: SHA }
		| { name: 'RSA-OAEP'; hash: SHA }
		| { name: 'RSA-PSS'; hash: SHA }
		| { name: 'ECDSA'; namedCurve: NIST }
		| { name: 'ECDH'; namedCurve: NIST }
		| { name: 'HMAC'; hash: SHA; length?: number }
		| { name: AES } | AES | 'PBKDF2' | 'HKDF';

	type Signing =
		| { name: 'RSASSA-PKCS1-v1_5' } | 'RSASSA-PKCS1-v1_5'
		| { name: 'RSA-PSS'; saltLength: number }
		| { name: 'ECDSA'; hash: SHA }
		| { name: 'HMAC' } | 'HMAC';
}
