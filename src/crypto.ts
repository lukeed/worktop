import { encode, toHEX } from 'worktop/utils';

export function digest(algo: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512', message: string): Promise<string> {
	return crypto.subtle.digest(algo, encode(message)).then(toHEX);
}

export const SHA1   = /*#__PURE__*/ digest.bind(0, 'SHA-1');
export const SHA256 = /*#__PURE__*/ digest.bind(0, 'SHA-256');
export const SHA384 = /*#__PURE__*/ digest.bind(0, 'SHA-384');
export const SHA512 = /*#__PURE__*/ digest.bind(0, 'SHA-512');
