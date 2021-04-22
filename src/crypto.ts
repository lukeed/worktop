import { encode, toHEX } from 'worktop/utils';
import type { Algorithms } from 'worktop/crypto';

export function digest(algo: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', message: string): Promise<string> {
	return crypto.subtle.digest(algo, encode(message)).then(toHEX);
}

export const SHA1   = /*#__PURE__*/ digest.bind(0, 'SHA-1');
export const SHA256 = /*#__PURE__*/ digest.bind(0, 'SHA-256');
export const SHA384 = /*#__PURE__*/ digest.bind(0, 'SHA-384');
export const SHA512 = /*#__PURE__*/ digest.bind(0, 'SHA-512');

export function keygen(secret: string, algo: Algorithms, scopes: KeyUsage[]): Promise<CryptoKey> {
	return crypto.subtle.importKey('raw', encode(secret), algo, false, scopes);
}

export async function sign(secret: string, algo: Algorithms, msg: string): Promise<ArrayBuffer> {
	const key = await keygen(secret, algo, ['sign']);
	const hashname = typeof algo === 'string' ? algo : algo.name;
	return crypto.subtle.sign(hashname, key, encode(msg));
}

export async function verify(secret: string, algo: Algorithms, signature: ArrayBuffer, payload: string): Promise<boolean> {
	const key = await keygen(secret, algo, ['verify']);
	const hashname = typeof algo === 'string' ? algo : algo.name;
	return crypto.subtle.verify(hashname, key, signature, encode(payload));
}
